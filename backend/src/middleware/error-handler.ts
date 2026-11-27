import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import * as z from 'zod';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import { MAX_FILE_SIZE_MB, MAX_FILES } from './upload';
import { isPrismaError, PrismaErrorCode } from '../lib/prisma-errors';

function hasBodyParserType(err: unknown, type: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: unknown }).type === type
  );
}

// Upload errors from multer (file too big, too many files, wrong field name)
function multerToAppError(err: multer.MulterError): AppError {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError(`Each image must be at most ${MAX_FILE_SIZE_MB} MB`, 413, 'FILE_TOO_LARGE');
    case 'LIMIT_FILE_COUNT':
      return new BadRequestError(`You can upload at most ${MAX_FILES} images at once`, 'TOO_MANY_FILES');
    case 'LIMIT_UNEXPECTED_FILE':
      return new BadRequestError('Images must be sent in the "photos" field', 'UNEXPECTED_FILE_FIELD');
    default:
      return new BadRequestError('The upload could not be processed', 'UPLOAD_FAILED');
  }
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

  if (isPrismaError(err, PrismaErrorCode.NOT_FOUND)) {
    return new NotFoundError();
  }

  if (isPrismaError(err, PrismaErrorCode.UNIQUE_VIOLATION)) {
    return new ConflictError('This value already exists', 'ALREADY_EXISTS');
  }

  if (isPrismaError(err, PrismaErrorCode.FOREIGN_KEY_VIOLATION)) {
    return new ConflictError('A related record prevents this action', 'RELATION_CONFLICT');
  }

  if (err instanceof multer.MulterError) {
    return multerToAppError(err);
  }

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
