import { requireEnv } from "src/common/env/env";
import { registerAs } from "@nestjs/config";


export default registerAs ( 'redis', () => {
	return {
		redisURL: requireEnv(
			'REDIS_URL',
		)
	};
})