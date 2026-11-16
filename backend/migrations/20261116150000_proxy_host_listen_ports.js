import { migrate as logger } from "../logger.js";

const migrateName = "proxy_host_listen_ports";

/**
 * Migrate
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const up = (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	return knex.schema
		.alterTable("proxy_host", (table) => {
			table.integer("listen_port").notNull().unsigned().defaultTo(80);
			table.integer("listen_port_ssl").notNull().unsigned().defaultTo(443);
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host Table altered`);
		});
};

/**
 * Undo Migrate
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const down = (knex) => {
	logger.info(`[${migrateName}] Migrating Down...`);

	return knex.schema
		.alterTable("proxy_host", (table) => {
			table.dropColumn("listen_port");
			table.dropColumn("listen_port_ssl");
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host Table altered`);
		});
};

export { up, down };
