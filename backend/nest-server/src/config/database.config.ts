import { registerAs } from "@nestjs/config";

import { getEnvNumber, requireEnv } from "src/common/env/env";


export default registerAs ('database', () => {
	return {
		host: requireEnv('POSTGRES_HOST'),
		port: getEnvNumber('POSTGRES_PORT',
			5432,
		),
		username: requireEnv('POSTGRES_USER'),
		password: requireEnv('POSTGRES_PASSWORD'),
		dbName:	requireEnv('POSTGRES_DB'),
	}
}

)