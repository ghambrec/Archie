//import {
//    ArgumentsHost,
//    Catch,
//    ExceptionFilter,
//  } from '@nestjs/common';
//  import { Request, Response } from 'express';
//  import { ApplicationException } from './application.exception';

//@Catch(ApplicationException)
//  export class ApplicationExceptionFilter implements ExceptionFilter {
//    catch(exception: ApplicationException, host: ArgumentsHost): void {
//      const http = host.switchToHttp();
//      const response = http.getResponse<Response>();
//      const request = http.getRequest<Request>();

//      const statusCode = exception.getStatus();
//      const exceptionResponse = exception.getResponse();

//      const message =
//        typeof exceptionResponse === 'string'
//          ? exceptionResponse
//          : exceptionResponse.message;

//      response.status(statusCode).json({
//        statusCode,
//        code: exception.code,
//        message,
//        path: request.url,
//        timestamp: new Date().toISOString(),
//      });
//    }
//  }
