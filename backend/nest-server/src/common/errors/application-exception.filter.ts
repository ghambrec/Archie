import {
    ArgumentsHost,
    Catch,
	ExceptionFilter
  } from '@nestjs/common';
 import { Request, Response } from 'express';
 import { ApplicationException } from './application.exception';


@Catch(ApplicationException)
   export class ApplicationExceptionFilter implements ExceptionFilter {
	catch(exception: ApplicationException, host:ArgumentsHost): void {
		const http = host.switchToHttp();
		const response = http.getResponse<Response>();
		const request = http.getRequest<Request>();

		const statusCode = exception.getStatus();

		if (exception.retryAfterSeconds !== undefined) {
        response.setHeader('Retry-After', String(exception.retryAfterSeconds));
      }
      response.status(statusCode).json({
        ...(exception.retryAfterSeconds !== undefined ? { retryAfterSeconds: exception.retryAfterSeconds } : {}),
			statusCode: statusCode,
			code: exception.code,
			message: exception.fallbackMessage,
			path: request.url,
			timeStamp: new Date().toISOString(),
		})
	}
}