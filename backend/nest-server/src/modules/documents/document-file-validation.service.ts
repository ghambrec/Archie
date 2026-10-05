import { Injectable } from "@nestjs/common";
import { extname } from "path";
import { ALLOWED_FILE_TYPES } from "./document-file.constants";
import { ApplicationException } from "src/common/errors/application.exception";
import { ErrorCode } from "src/common/errors/error-code";
import { fileTypeFromBuffer } from "file-type";

@Injectable()
export class DocumentFileValidationService {
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
