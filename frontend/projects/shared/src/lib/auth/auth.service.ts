import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../api/api-config';
import type { ApiResponse, Role, Session, User } from '../api/api.types';

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { fullName: string; phone?: string };

/**
 * Keeps the logged-in user.
 * - The access token lives only in memory (a signal): safe from other scripts reading localStorage.
 * - The refresh token is an httpOnly cookie that the browser sends to /api/auth by itself.
 *   After a page reload we call /auth/refresh to get a new access token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  private readonly _user = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  // While a refresh is running, everybody waits for the same request
  private refreshInProgress$: Observable<string | null> | null = null;

  login(input: LoginInput): Observable<User> {
    return this.http
      .post<ApiResponse<Session>>(`${this.api}/auth/login`, input, { withCredentials: true })
      .pipe(map(({ data }) => this.startSession(data)));
  }

  register(input: RegisterInput): Observable<User> {
    return this.http
      .post<ApiResponse<Session>>(`${this.api}/auth/register`, input, { withCredentials: true })
      .pipe(map(({ data }) => this.startSession(data)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.api}/auth/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  /**
   * Gets a new access token with the refresh cookie.
   * Returns the token, or null when the user is not logged in any more.
   */
  refresh(): Observable<string | null> {
    this.refreshInProgress$ ??= this.http
      .post<ApiResponse<Session>>(`${this.api}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map(({ data }) => {
          this.startSession(data);
          return data.accessToken;
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
        finalize(() => (this.refreshInProgress$ = null)),
        shareReplay(1),
      );

    return this.refreshInProgress$;
  }

  // Called once when the app starts in the browser: restores the session after a reload.
  // Visitors who never logged in skip the request (no useless 401 on every page load).
  restoreSession(): Observable<boolean> {
    if (!readSessionFlag()) return of(false);
    return this.refresh().pipe(map((token) => token !== null));
  }

  hasRole(...roles: Role[]): boolean {
    const user = this._user();
    return user !== null && roles.includes(user.role);
  }

  clearSession(): void {
    this._user.set(null);
    this._accessToken.set(null);
    writeSessionFlag(false);
  }

  private startSession(session: Session): User {
    this._user.set(session.user);
    this._accessToken.set(session.accessToken);
    writeSessionFlag(true);
    return session.user;
  }
}

// Only a "was logged in" hint, never a token. localStorage can be missing (server) or blocked.
const SESSION_FLAG = 'seyyar_has_session';

function readSessionFlag(): boolean {
  try {
    return globalThis.localStorage?.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeSessionFlag(on: boolean): void {
  try {
    if (on) globalThis.localStorage?.setItem(SESSION_FLAG, '1');
    else globalThis.localStorage?.removeItem(SESSION_FLAG);
  } catch {
    // Private mode or server: nothing to remember
  }
}
