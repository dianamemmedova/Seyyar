import { describe, expect, it } from 'vitest';
import multer from 'multer';
import * as z from 'zod';
import { toAppError } from '../../src/middleware/error-handler';
import { NotFoundError } from '../../src/lib/errors';

describe('toAppError', () => {
  it('keeps our own errors as they are', () => {
    const error = new NotFoundError('Place');
    expect(toAppError(error)).toBe(error);
  });

  it('turns a Zod error into 400 VALIDATION_ERROR with field details', () => {
    const result = z.object({ email: z.email() }).safeParse({ email: 'nope' });
    const appError = toAppError(result.error);

    expect(appError).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(appError.details).toEqual([{ field: 'email', message: expect.any(String) }]);
  });

  it.each([
    ['P2025', 404, 'NOT_FOUND'],
    ['P2002', 409, 'ALREADY_EXISTS'],
    ['P2003', 409, 'RELATION_CONFLICT'],
  ])('maps Prisma error %s to %i %s', (prismaCode, statusCode, code) => {
    expect(toAppError({ code: prismaCode })).toMatchObject({ statusCode, code });
  });

  it.each([
    ['LIMIT_FILE_SIZE', 413, 'FILE_TOO_LARGE'],
    ['LIMIT_FILE_COUNT', 400, 'TOO_MANY_FILES'],
    ['LIMIT_UNEXPECTED_FILE', 400, 'UNEXPECTED_FILE_FIELD'],
  ] as const)('maps multer %s to %i %s', (multerCode, statusCode, code) => {
    expect(toAppError(new multer.MulterError(multerCode))).toMatchObject({ statusCode, code });
  });

  it('hides unknown errors behind 500 INTERNAL', () => {
    const appError = toAppError(new Error('database password is wrong'));
    expect(appError).toMatchObject({
      statusCode: 500,
      code: 'INTERNAL',
      message: 'Internal server error',
    });
  });
});
