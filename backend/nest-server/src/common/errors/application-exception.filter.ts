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

		response.status(statusCode).json({
			statusCode: statusCode,
			code: exception.code,
			message: exception.fallbackMessage,
			path: request.url,
			timeStamp: new Date().toISOString(),
		})
	}
}