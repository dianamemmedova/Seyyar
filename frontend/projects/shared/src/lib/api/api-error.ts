import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorBody } from './api.types';

export type ApiError = {
  status: number;
  code: string;
  message: string;
  // { email: 'Invalid email address', password: '...' } for form fields
  fieldErrors: Record<string, string>;
};

// Turns any HttpClient error into one simple shape that components can show
export function toApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiErrorBody> | null;

    if (body?.error) {
      const fieldErrors: Record<string, string> = {};
      for (const detail of body.error.details ?? []) {
        if (detail.field && !fieldErrors[detail.field]) {
          fieldErrors[detail.field] = detail.message;
        }
      }
      return {
        status: error.status,
        code: body.error.code,
        message: body.error.message,
        fieldErrors,
      };
    }

    // status 0 = no answer at all (server down, no internet)
    if (error.status === 0) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'No connection to the server',
        fieldErrors: {},
      };
    }
  }

  return { status: 500, code: 'UNKNOWN', message: 'Something went wrong', fieldErrors: {} };
}
