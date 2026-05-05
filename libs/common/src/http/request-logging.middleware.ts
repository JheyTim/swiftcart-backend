import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import {
  CORRELATION_ID_HEADER,
  RequestWithCorrelationId,
} from './correlation-id.middleware';

// This middleware logs basic HTTP request information.
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(
    request: RequestWithCorrelationId,
    response: Response,
    next: NextFunction,
  ) {
    const startedAt = Date.now();
    // Log after the response finishes so status code and duration are available.
    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      // Use structured JSON logs so log tools can parse fields reliably.
      console.log(
        JSON.stringify({
          type: 'http_request',
          correlationId:
            request.correlationId ?? request.header(CORRELATION_ID_HEADER),
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs,
        }),
      );
    });
    next();
  }
}
