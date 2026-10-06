import { registerAs } from "@nestjs/config";
import { getEnvNumber } from "src/common/env/env";

export default registerAs('documents', () => {
	const maxUploadSizeMb = getEnvNumber('DOCUMENT_MAX_UPLOAD_SIZE_MB', 25);

	if (maxUploadSizeMb <= 0) {
		throw new Error('DOCUMENT_MAX_UPLOAD_SIZE_MB must be greater than 0');
	}

	return {
		maxUploadSizeBytes: maxUploadSizeMb * 1024 * 1024
	};
});
