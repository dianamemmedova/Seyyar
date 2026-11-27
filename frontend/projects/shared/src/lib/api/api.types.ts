// Shapes of the Seyyar API responses (see backend/README.md)

export type Lang = 'en' | 'ru' | 'az';
export const LANGS: readonly Lang[] = ['en', 'ru', 'az'];

export type Role = 'TOURIST' | 'PARTNER' | 'DRIVER' | 'ADMIN';

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Every successful response: { data, meta? }
export type ApiResponse<T, M = undefined> = M extends undefined
  ? { data: T }
  : { data: T; meta: M };

// Every error response: { error: { code, message, requestId, details? } }
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: { field: string | null; message: string }[];
  };
};

export type User = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  language: string;
  currency: string;
  createdAt: string;
};

export type Session = {
  user: User;
  accessToken: string;
};
