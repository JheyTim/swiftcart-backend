import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithCorrelationId } from './correlation-id.middleware';

// This filter standardizes error responses across services.
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithCorrelationId>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Avoid leaking internal error details to clients.
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: unknown }).message
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : exception instanceof Error
            ? exception.message
            : 'Unexpected error';

    // Log the full error internally with correlation ID.
    console.error(
      JSON.stringify({
        type: 'http_error',
        correlationId: request.correlationId,
        method: request.method,
        path: request.originalUrl,
        statusCode: status,
        errorName: exception instanceof Error ? exception.name : 'UnknownError',
        errorMessage:
          exception instanceof Error ? exception.message : String(exception),
      }),
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl,
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
