import { getEnvNumber} from "src/common/env/env";
import { registerAs } from "@nestjs/config";

export default registerAs ( 'storage', () => {
	return {
		urlExpire: getEnvNumber('DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS',
		5 * 60,
		),
}})


