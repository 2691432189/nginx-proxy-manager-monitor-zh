import _ from "lodash";
import errs from "../lib/error.js";
import { castJsonIfNeed } from "../lib/helpers.js";
import { validateListenPorts } from "../lib/listen-ports.js";
import utils from "../lib/utils.js";
import proxyHostModel, { scopeToOwnerOrAllowed } from "../models/proxy_host.js";
import streamModel from "../models/stream.js";
import internalAuditLog from "./audit-log.js";
import internalCertificate from "./certificate.js";
import internalHost from "./host.js";
import internalNginx from "./nginx.js";

const omissions = () => {
	return ["is_deleted", "owner.is_deleted"];
};

const hasListenPortChanges = (data, createCertificate, existing) =>
	typeof data.listen_port !== "undefined" ||
	typeof data.listen_port_ssl !== "undefined" ||
	!!createCertificate ||
	typeof data.certificate_id !== "undefined" ||
	// Re-enabling through the update endpoint has to re-check the ports like enable() does
	(typeof data.enabled !== "undefined" && !!data.enabled && !!existing && !existing.enabled);

/**
 * Merge the incoming ports with the stored ones, then validate them.
 *
 * @param   {Object}   data
 * @param   {Object}   [existing]
 * @param   {Boolean}  [createCertificate]
 * @returns {Promise<Object>}
 */
const normaliseListenPorts = async (data, existing, createCertificate, includeHostDetails = true) => {
	if (!hasListenPortChanges(data, createCertificate, existing)) {
		return data;
	}

	const httpPort = typeof data.listen_port !== "undefined" ? data.listen_port : existing ? existing.listen_port : 80;
	const sslPort =
		typeof data.listen_port_ssl !== "undefined" ? data.listen_port_ssl : existing ? existing.listen_port_ssl : 443;

	const hasCertificate =
		!!createCertificate ||
		(typeof data.certificate_id !== "undefined" ? Number(data.certificate_id) > 0 : !!existing?.certificate_id);

	const [otherHosts, tcpStreams] = await Promise.all([
		proxyHostModel
			.query()
			.where("is_deleted", 0)
			.andWhere("enabled", 1)
			.whereNot("id", existing?.id || 0)
			.select("id", "domain_names", "listen_port", "listen_port_ssl", "certificate_id"),
		streamModel
			.query()
			.where("is_deleted", 0)
			.andWhere("enabled", 1)
			.andWhere("tcp_forwarding", 1)
			.select("id", "incoming_port"),
	]);

	const ports = validateListenPorts({
		httpPort,
		sslPort,
		hasCertificate,
		includeHostDetails,
		otherHosts: otherHosts.map((host) => ({
			id: host.id,
			domain_names: host.domain_names,
			listen_port: host.listen_port,
			listen_port_ssl: host.listen_port_ssl,
			has_certificate: !!host.certificate_id,
		})),
		tcpStreams: tcpStreams.map((stream) => ({
			id: stream.id,
			incoming_port: stream.incoming_port,
		})),
	});

	data.listen_port = ports.httpPort;
	data.listen_port_ssl = ports.sslPort;

	return data;
};

const internalProxyHost = {
	/**
	 * @param   {Access}  access
	 * @param   {Object}  data
	 * @returns {Promise}
	 */
	create: (access, data) => {
		let thisData = data;
		const createCertificate = thisData.certificate_id === "new";

		if (createCertificate) {
			delete thisData.certificate_id;
		}

		return access
			.can("proxy_hosts:create", thisData)
			.then(() => {
				// Get a list of the domain names and check each of them against existing records
				const domain_name_check_promises = [];

				thisData.domain_names.map((domain_name) => {
					domain_name_check_promises.push(internalHost.isHostnameTaken(domain_name));
					return true;
				});

				return Promise.all(domain_name_check_promises).then((check_results) => {
					check_results.map((result) => {
						if (result.is_taken) {
							throw new errs.ValidationError(`${result.hostname} is already in use`);
						}
						return true;
					});
				});
			})
			.then(async () => {
				// At this point the domains should have been checked
				thisData.owner_user_id = access.token.getUserId(1);
				thisData = internalHost.cleanSslHstsData(thisData);
				thisData = await normaliseListenPorts(thisData, null, createCertificate, access.isAdmin());

				// Fix for db field not having a default value
				// for this optional field.
				if (typeof thisData.advanced_config === "undefined") {
					thisData.advanced_config = "";
				}

				internalHost.assertAdvancedConfigAllowed(access, thisData);

				return proxyHostModel.query().insertAndFetch(thisData).then(utils.omitRow(omissions()));
			})
			.then((row) => {
				if (createCertificate) {
					return internalCertificate
						.createQuickCertificate(access, thisData)
						.then((cert) => {
							// update host with cert id
							return internalProxyHost.update(access, {
								id: row.id,
								certificate_id: cert.id,
							});
						})
						.then(() => {
							return row;
						});
				}
				return row;
			})
			.then((row) => {
				// re-fetch with cert
				return internalProxyHost.get(access, {
					id: row.id,
					expand: ["certificate", "owner", "access_list.[clients,items]"],
				});
			})
			.then(async (row) => {
				// Configure nginx
				return internalNginx.configure(proxyHostModel, "proxy_host", row).then(() => {
					return row;
				});
			})
			.then((row) => {
				// Audit log
				thisData.meta = _.assign({}, thisData.meta || {}, row.meta);

				// Add to audit log
				return internalAuditLog
					.add(access, {
						action: "created",
						object_type: "proxy-host",
						object_id: row.id,
						meta: thisData,
					})
					.then(() => {
						return row;
					});
			});
	},

	/**
	 * @param  {Access}  access
	 * @param  {Object}  data
	 * @param  {Number}  data.id
	 * @return {Promise}
	 */
	update: (access, data) => {
		let thisData = data;
		let wasEnabled = null;
		const createCertificate = thisData.certificate_id === "new";

		if (createCertificate) {
			delete thisData.certificate_id;
		}

		return access
			.can("proxy_hosts:update", thisData.id)
			.then((/*access_data*/) => {
				// Get a list of the domain names and check each of them against existing records
				const domain_name_check_promises = [];

				if (typeof thisData.domain_names !== "undefined") {
					thisData.domain_names.map((domain_name) => {
						return domain_name_check_promises.push(
							internalHost.isHostnameTaken(domain_name, "proxy", thisData.id),
						);
					});

					return Promise.all(domain_name_check_promises).then((check_results) => {
						check_results.map((result) => {
							if (result.is_taken) {
								throw new errs.ValidationError(`${result.hostname} is already in use`);
							}
							return true;
						});
					});
				}
			})
			.then(() => {
				return internalProxyHost.get(access, { id: thisData.id });
			})
			.then(async (row) => {
				if (row.id !== thisData.id) {
					// Sanity check that something crazy hasn't happened
					throw new errs.InternalValidationError(
						`Proxy Host could not be updated, IDs do not match: ${row.id} !== ${thisData.id}`,
					);
				}

				wasEnabled = !!row.enabled;

				// Before the certificate is created, so a refused request doesn't leave one behind
				internalHost.assertAdvancedConfigAllowed(access, thisData, row);

				if (createCertificate) {
					// Also check the ports before requesting the certificate, so a refused update doesn't leave one behind
					await normaliseListenPorts(thisData, row, true, access.isAdmin());
				}

				if (createCertificate) {
					return internalCertificate
						.createQuickCertificate(access, {
							domain_names: thisData.domain_names || row.domain_names,
							meta: _.assign({}, row.meta, thisData.meta),
						})
						.then((cert) => {
							// update host with cert id
							thisData.certificate_id = cert.id;
						})
						.then(() => {
							return row;
						});
				}
				return row;
			})
			.then(async (row) => {
				// Add domain_names to the data in case it isn't there, so that the audit log renders correctly. The order is important here.
				thisData = _.assign(
					{},
					{
						domain_names: row.domain_names,
					},
					data,
				);

				thisData = await normaliseListenPorts(thisData, row, createCertificate, access.isAdmin());
				thisData = internalHost.cleanSslHstsData(thisData, row);

				return proxyHostModel
					.query()
					.where({ id: thisData.id })
					.patch(thisData)
					.then(utils.omitRow(omissions()))
					.then((saved_row) => {
						// Add to audit log
						return internalAuditLog
							.add(access, {
								action: "updated",
								object_type: "proxy-host",
								object_id: row.id,
								meta: thisData,
							})
							.then(() => {
								return saved_row;
							});
					});
			})
			.then(() => {
				return internalProxyHost
					.get(access, {
						id: thisData.id,
						expand: ["owner", "certificate", "access_list.[clients,items]"],
					})
					.then(async (row) => {
						if (!row.enabled) {
							// A PUT can also disable a host; remove its config like disable() does
							if (wasEnabled) {
								await internalNginx.deleteConfig("proxy_host", row);
								await internalNginx.reload();
							}
							return row;
						}
						// Configure nginx
						return internalNginx.configure(proxyHostModel, "proxy_host", row).then((new_meta) => {
							row.meta = new_meta;
							return _.omit(internalHost.cleanRowCertificateMeta(row), omissions());
						});
					});
			});
	},

	/**
	 * @param  {Access}   access
	 * @param  {Object}   data
	 * @param  {Number}   data.id
	 * @param  {Array}    [data.expand]
	 * @param  {Array}    [data.omit]
	 * @return {Promise}
	 */
	get: (access, data) => {
		const thisData = data || {};
		return access
			.can("proxy_hosts:get", thisData.id)
			.then((access_data) => {
				const query = proxyHostModel
					.query()
					.where("is_deleted", 0)
					.andWhere("id", thisData.id)
					.allowGraph(proxyHostModel.defaultAllowGraph)
					.first();

				if (access_data.permission_visibility !== "all") {
					scopeToOwnerOrAllowed(query, access.token.getUserId(1), access.getPermissions?.()?.meta);
				}

				if (typeof thisData.expand !== "undefined" && thisData.expand !== null) {
					query.withGraphFetched(`[${thisData.expand.join(", ")}]`);
				}

				return query.then(utils.omitRow(omissions()));
			})
			.then((row) => {
				if (!row?.id) {
					throw new errs.ItemNotFoundError(thisData.id);
				}
				const thisRow = internalHost.cleanRowCertificateMeta(row);
				// Custom omissions
				if (typeof thisData.omit !== "undefined" && thisData.omit !== null) {
					return _.omit(row, thisData.omit);
				}
				return thisRow;
			});
	},

	/**
	 * @param {Access}  access
	 * @param {Object}  data
	 * @param {Number}  data.id
	 * @param {String}  [data.reason]
	 * @returns {Promise}
	 */
	delete: (access, data) => {
		return access
			.can("proxy_hosts:delete", data.id)
			.then(() => {
				return internalProxyHost.get(access, { id: data.id });
			})
			.then((row) => {
				if (!row?.id) {
					throw new errs.ItemNotFoundError(data.id);
				}

				return proxyHostModel
					.query()
					.where("id", row.id)
					.patch({
						is_deleted: 1,
					})
					.then(() => {
						// Delete Nginx Config
						return internalNginx.deleteConfig("proxy_host", row).then(() => {
							return internalNginx.reload();
						});
					})
					.then(() => {
						// Add to audit log
						return internalAuditLog.add(access, {
							action: "deleted",
							object_type: "proxy-host",
							object_id: row.id,
							meta: _.omit(row, omissions()),
						});
					});
			})
			.then(() => {
				return true;
			});
	},

	/**
	 * @param {Access}  access
	 * @param {Object}  data
	 * @param {Number}  data.id
	 * @param {String}  [data.reason]
	 * @returns {Promise}
	 */
	enable: (access, data) => {
		return access
			.can("proxy_hosts:update", data.id)
			.then(() => {
				return internalProxyHost.get(access, {
					id: data.id,
					expand: ["certificate", "owner", "access_list.[clients,items]"],
				});
			})
			.then(async (row) => {
				if (!row?.id) {
					throw new errs.ItemNotFoundError(data.id);
				}
				if (row.enabled) {
					throw new errs.ValidationError("Host is already enabled");
				}

				// A disabled host has no nginx config, so re-check the ports before it comes back
				await normaliseListenPorts(
					{ listen_port: row.listen_port ?? 80, listen_port_ssl: row.listen_port_ssl ?? 443 },
					row,
					false,
					access.isAdmin(),
				);

				row.enabled = 1;

				await proxyHostModel.query().where("id", row.id).patch({
					enabled: 1,
				});

				// Configure nginx
				await internalNginx.configure(proxyHostModel, "proxy_host", row);

				// Add to audit log
				await internalAuditLog.add(access, {
					action: "enabled",
					object_type: "proxy-host",
					object_id: row.id,
					meta: _.omit(row, omissions()),
				});

				return true;
			});
	},

	/**
	 * @param {Access}  access
	 * @param {Object}  data
	 * @param {Number}  data.id
	 * @param {String}  [data.reason]
	 * @returns {Promise}
	 */
	disable: (access, data) => {
		return access
			.can("proxy_hosts:update", data.id)
			.then(() => {
				return internalProxyHost.get(access, { id: data.id });
			})
			.then((row) => {
				if (!row?.id) {
					throw new errs.ItemNotFoundError(data.id);
				}
				if (!row.enabled) {
					throw new errs.ValidationError("Host is already disabled");
				}

				row.enabled = 0;

				return proxyHostModel
					.query()
					.where("id", row.id)
					.patch({
						enabled: 0,
					})
					.then(() => {
						// Delete Nginx Config
						return internalNginx.deleteConfig("proxy_host", row).then(() => {
							return internalNginx.reload();
						});
					})
					.then(() => {
						// Add to audit log
						return internalAuditLog.add(access, {
							action: "disabled",
							object_type: "proxy-host",
							object_id: row.id,
							meta: _.omit(row, omissions()),
						});
					});
			})
			.then(() => {
				return true;
			});
	},

	/**
	 * All Hosts
	 *
	 * @param   {Access}  access
	 * @param   {Array}   [expand]
	 * @param   {String}  [search_query]
	 * @returns {Promise}
	 */
	getAll: async (access, expand, searchQuery) => {
		const accessData = await access.can("proxy_hosts:list");

		const query = proxyHostModel
			.query()
			.where("is_deleted", 0)
			.groupBy("id")
			.allowGraph(proxyHostModel.defaultAllowGraph)
			.orderBy(castJsonIfNeed("domain_names"), "ASC");

		if (accessData.permission_visibility !== "all") {
			scopeToOwnerOrAllowed(query, access.token.getUserId(1), access.getPermissions?.()?.meta);
		}

		// Query is used for searching
		if (typeof searchQuery === "string" && searchQuery.length > 0) {
			query.where(function () {
				this.where(castJsonIfNeed("domain_names"), "like", `%${searchQuery}%`);
			});
		}

		if (typeof expand !== "undefined" && expand !== null) {
			query.withGraphFetched(`[${expand.join(", ")}]`);
		}

		const rows = await query.then(utils.omitRows(omissions()));
		if (typeof expand !== "undefined" && expand !== null && expand.indexOf("certificate") !== -1) {
			return internalHost.cleanAllRowsCertificateMeta(rows);
		}
		return rows;
	},

	/**
	 * Report use
	 *
	 * @param   {Number}  user_id
	 * @param   {String}  visibility
	 * @param   {Object}  [permissionsMeta]  the user's permissions meta, as already loaded by access
	 * @returns {Promise}
	 */
	getCount: async (user_id, visibility, permissionsMeta) => {
		const query = proxyHostModel.query().count("id as count").where("is_deleted", 0);

		if (visibility !== "all") {
			scopeToOwnerOrAllowed(query, user_id, permissionsMeta);
		}

		const row = await query.first();
		return Number.parseInt(row.count, 10);
	},
};

export default internalProxyHost;
