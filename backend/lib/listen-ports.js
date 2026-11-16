import errs from "./error.js";

// Ports nginx-proxy-manager itself listens on inside the container.
const BACKEND_PORT = 3000;
const DEFAULT_ADMIN_PORT = 81;

/**
 * The admin interface port, as configured for the container.
 * The startup script falls back to 81 for anything that is not a number.
 *
 * @returns {Number}
 */
const getAdminPort = () => {
	const raw = String(process.env.NPM_ADMIN_PORT || "").trim();
	if (!/^\d+$/.test(raw)) {
		return DEFAULT_ADMIN_PORT;
	}
	const port = Number(raw);
	return port >= 1 && port <= 65535 ? port : DEFAULT_ADMIN_PORT;
};

/**
 * @param   {*}      value
 * @param   {String} label
 * @returns {Number}
 */
const parsePort = (value, label) => {
	// Only real numbers and plain decimal strings; Number() alone would accept true, "0x10", "1e3"
	let port;
	if (typeof value === "number") {
		port = value;
	} else if (typeof value === "string" && /^\d+$/.test(value)) {
		port = Number(value);
	} else {
		port = Number.NaN;
	}

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new errs.ValidationError(`${label} must be an integer between 1 and 65535`);
	}
	return port;
};

const describeHost = (host, includeHostDetails) => {
	if (!includeHostDetails) {
		return "another Proxy Host";
	}
	const domains =
		Array.isArray(host.domain_names) && host.domain_names.length > 0 ? ` (${host.domain_names.join(", ")})` : "";
	return `Proxy Host #${host.id}${domains}`;
};

/**
 * Validate the listen ports of a proxy host.
 *
 * @param   {Object}  args
 * @param   {Number}  args.httpPort
 * @param   {Number}  args.sslPort
 * @param   {Boolean} args.hasCertificate
 * @param   {Boolean} [args.includeHostDetails]  include other hosts' ids/domains in errors (admins only)
 * @param   {Array}   [args.otherHosts]  [{id, domain_names, listen_port, listen_port_ssl, has_certificate}]
 * @param   {Array}   [args.tcpStreams]  [{id, incoming_port}]
 * @returns {{httpPort: Number, sslPort: Number}}
 */
const validateListenPorts = ({
	httpPort,
	sslPort,
	hasCertificate,
	includeHostDetails = true,
	otherHosts = [],
	tcpStreams = [],
}) => {
	const http = parsePort(httpPort, "HTTP listen port");
	const ssl = parsePort(sslPort, "HTTPS listen port");

	if (http === BACKEND_PORT) {
		throw new errs.ValidationError(`Port ${BACKEND_PORT} is reserved by the Nginx Proxy Manager backend`);
	}
	if (ssl === BACKEND_PORT) {
		throw new errs.ValidationError(`Port ${BACKEND_PORT} is reserved by the Nginx Proxy Manager backend`);
	}

	const adminPort = getAdminPort();
	if (http === adminPort) {
		throw new errs.ValidationError(`Port ${adminPort} is reserved by the Nginx Proxy Manager admin interface`);
	}
	if (ssl === adminPort) {
		throw new errs.ValidationError(`Port ${adminPort} is reserved by the Nginx Proxy Manager admin interface`);
	}

	// 80 is always plain HTTP (default site + fallback); 443 is always TLS (fallback).
	if (http === 443) {
		throw new errs.ValidationError("Port 443 is always used for HTTPS; choose another HTTP listen port");
	}
	if (ssl === 80) {
		throw new errs.ValidationError("Port 80 is always used for HTTP; choose another HTTPS listen port");
	}

	if (hasCertificate && http === ssl) {
		throw new errs.ValidationError("HTTP and HTTPS listen ports must be different when a certificate is set");
	}

	// A port can't be plain in one host and TLS in another: nginx requires the same
	// listen options for every server block on an address:port.
	const plain = new Map();
	const tls = new Map();

	for (const host of otherHosts) {
		plain.set(Number(host.listen_port), describeHost(host, includeHostDetails));
		if (host.has_certificate) {
			tls.set(Number(host.listen_port_ssl), describeHost(host, includeHostDetails));
		}
	}

	if (tls.has(http)) {
		throw new errs.ValidationError(`Port ${http} is already used for HTTPS by ${tls.get(http)}`);
	}
	if (hasCertificate && plain.has(ssl)) {
		throw new errs.ValidationError(`Port ${ssl} is already used for HTTP by ${plain.get(ssl)}`);
	}

	// nginx cannot bind an http server and a TCP stream server to the same address:port.
	for (const stream of tcpStreams) {
		if (stream.incoming_port === http || (hasCertificate && stream.incoming_port === ssl)) {
			const streamLabel = includeHostDetails ? `Stream #${stream.id}` : "another Stream";
			throw new errs.ValidationError(`Port ${stream.incoming_port} is already used by ${streamLabel}`);
		}
	}

	return { httpPort: http, sslPort: ssl };
};

export { BACKEND_PORT, DEFAULT_ADMIN_PORT, getAdminPort, validateListenPorts };
