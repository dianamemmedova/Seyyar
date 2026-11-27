import type { ErrorRequestHandler, RequestHandler } from 'express';
import * as z from 'zod';
import { AppError, NotFoundError, ValidationError } from '../lib/errors';

function hasBodyParserType(err: unknown, type: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: unknown }).type === type
  );
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof z.ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : null,
      message: issue.message,
    }));
    return new ValidationError('Request data is invalid', details);
  }

  if (hasBodyParserType(err, 'entity.parse.failed')) {
    return new ValidationError('Request body is not valid JSON');
  }

  if (hasBodyParserType(err, 'entity.too.large')) {
    return new AppError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  }

  // B3: Prisma errors (unique, not found, foreign key) will be mapped here
  // B10: Multer upload errors will be mapped here

  return new AppError('Internal server error', 500, 'INTERNAL');
}

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);

  if (appError.statusCode >= 500) {
    console.error(`[${req.id}]`, err);
  } else {
    console.warn(`[${req.id}] ${appError.statusCode} ${appError.code}: ${appError.message}`);
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      requestId: req.id,
      ...(appError.details !== undefined && { details: appError.details }),
    },
  });
};
