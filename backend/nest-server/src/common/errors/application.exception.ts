import { HttpException } from "@nestjs/common";
import { ERROR_CATALOG } from "./error-catalog";
import { ErrorCode } from "./error-code";
import { exitCode } from "node:process";

export class ApplicationException extends HttpException {
	constructor(public readonly code: ErrorCode) {
		const definition = ERROR_CATALOG[code];

		super(
			{
				code: code, 
				message: definition.message,

			},
			definition.status,

		);
	}
}