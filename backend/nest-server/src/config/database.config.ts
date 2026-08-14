import { registerAs } from "@nestjs/config";
import { getEnvNumber, requireEnv } from "../common/env/env";


export function loadDatabaseConfig () {
	return {
		host: requireEnv('POSTGRES_HOST'),
		port: getEnvNumber('POSTGRES_PORT',
			5432,
		),
		username: requireEnv('POSTGRES_USER'),
		password: requireEnv('POSTGRES_PASSWORD'),
		dbName:	requireEnv('POSTGRES_DB'),
		};
	};

export default registerAs( 
	'database',
	 loadDatabaseConfig
);