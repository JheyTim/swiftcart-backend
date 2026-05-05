import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Header name used to pass correlation IDs between services.
export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Extend Express Request so TypeScript knows correlationId exists.
export type RequestWithCorrelationId = Request & {
  correlationId: string;
};

// This middleware ensures every HTTP request has a correlation ID.
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(
    request: RequestWithCorrelationId,
    response: Response,
    next: NextFunction,
  ) {
    // Use the incoming correlation ID if provided by a trusted caller.
    // Otherwise, generate a new one.
    const incomingCorrelationId = request.header(CORRELATION_ID_HEADER);
    request.correlationId = incomingCorrelationId ?? randomUUID();

    // Return the correlation ID in the response so clients can report it during debugging.
    response.setHeader(CORRELATION_ID_HEADER, request.correlationId);

    next();
  }
}
