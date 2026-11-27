import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('reads the code, the message and the field errors of an API error', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request data is invalid',
          requestId: 'abc',
          details: [
            { field: 'email', message: 'Invalid email address' },
            { field: 'email', message: 'second message is ignored' },
            { field: null, message: 'not about one field' },
          ],
        },
      },
    });

    expect(toApiError(error)).toEqual({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request data is invalid',
      fieldErrors: { email: 'Invalid email address' },
    });
  });

  it('recognises "no connection"', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).code).toBe('NETWORK_ERROR');
  });

  it('handles anything else', () => {
    expect(toApiError(new Error('boom'))).toMatchObject({ status: 500, code: 'UNKNOWN' });
  });
});
