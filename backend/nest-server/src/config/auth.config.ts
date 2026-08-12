import { registerAs } from "@nestjs/config";
import { getEnvNumber } from "src/common/env/env";


export default registerAs('auth', () =>{
	return {
	maxLoginAttempts: getEnvNumber(
		'AUTH_MAX_LOGIN_ATTEMPTS',
		 5,
	),
	loginLockoutSeconds: getEnvNumber(
	'AUTH_LOGIN_LOCKOUT_SECONDS',
	15 * 60,
	),

}})
