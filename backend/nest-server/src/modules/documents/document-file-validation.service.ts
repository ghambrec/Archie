import { Inject, Injectable } from "@nestjs/common";
import { extname } from "path";
import { ALLOWED_FILE_TYPES } from "./document-file.constants";
import { ApplicationException } from "src/common/errors/application.exception";
import { ErrorCode } from "src/common/errors/error-code";
import { fileTypeFromBuffer } from "file-type";
import documentsConfig from "src/config/documents.config";
import type { ConfigType } from "@nestjs/config";
import { UploadConfigResponseDto } from "./dto/upload-config-response.dto";

@Injectable()
export class DocumentFileValidationService {
	constructor(
		@Inject(documentsConfig.KEY)
		private readonly config: ConfigType<typeof documentsConfig>
	) {}

	getUploadConfig(): UploadConfigResponseDto {
		const entries = [...ALLOWED_FILE_TYPES.entries()];

		return {
			maxSizeBytes: this.config.maxUploadSizeBytes,
			allowedExtensions: entries.map(([ext]) => `.${ext}`),
			aiSupportedExtensions: entries
								.filter(([, type]) => type.aiSupported)
								.map(([ext]) => `.${ext}`)
		};
	}

	async validate(file: Express.Multer.File): Promise<string> {
		const extension = extname(file.originalname).slice(1).toLowerCase();
		const allowed = ALLOWED_FILE_TYPES.get(extension);

		if (!allowed) {
			throw new ApplicationException(ErrorCode.DocumentFileTypeNotAllowed);
		}

		const detected = await fileTypeFromBuffer(file.buffer);
		if ((detected?.mime ?? null) !== allowed.detectedMimeType) {
			throw new ApplicationException(ErrorCode.DocumentFileTypeMismatch);
		}

		return allowed.mimeType;
	}
}
