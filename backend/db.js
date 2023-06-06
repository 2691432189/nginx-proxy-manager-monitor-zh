const config = require('config');

if (!config.has('database')) {
	throw new Error('Database config does not exist! Please read the instructions: https://github.com/jc21/nginx-proxy-manager/blob/master/doc/INSTALL.md');
}

function generateDbConfig() {
	if (config.database.engine === 'knex-native') {
		return config.database.knex;
	} else
		return {
			client:     config.database.engine,
			connection: {
				host:     config.database.host,
				user:     config.database.user,
				password: config.database.password,
				database: config.database.name,
				port:     config.database.port
			},
			migrations: {
				tableName: 'migrations'
			}
		};
}


let data = generateDbConfig();

if (typeof config.database.version !== 'undefined') {
	data.version = config.database.version;
}

module.exports = require('knex')(data);
