
import { HttpException } from '@nestjs/common';
import { ERROR_CATALOG } from './error-catalog';
import { ErrorCode } from './error-code';



  export class ApplicationException extends HttpException {
    public readonly fallbackMessage: string;

    constructor(public readonly code: ErrorCode) {
      const definition = ERROR_CATALOG[code];

      super(
        {
          code: code,
          message: definition.message,
        },
        definition.status,
      );

      this.fallbackMessage = definition.message;
    }
  }
