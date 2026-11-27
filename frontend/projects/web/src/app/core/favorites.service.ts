import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, API_BASE_URL, type ApiResponse } from '@seyyar/shared';

/**
 * Which places the user saved (the heart on every card).
 * Loads the slugs once after login; a click updates the heart at once and then tells the API.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  private readonly auth = inject(AuthService);

  private readonly slugs = signal<ReadonlySet<string>>(new Set());
  // true once the saved slugs arrived from the API
  readonly loaded = signal(false);

  constructor() {
    // Login -> load the saved slugs. Logout -> forget them.
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => {
        if (loggedIn) {
          this.load();
        } else {
          this.slugs.set(new Set());
          this.loaded.set(false);
        }
      });
    });
  }

  isFavorite(slug: string): boolean {
    return this.slugs().has(slug);
  }

  toggle(slug: string): void {
    const wasFavorite = this.isFavorite(slug);
    this.setOne(slug, !wasFavorite);

    const request = wasFavorite
      ? this.http.delete(`${this.api}/favorites/${slug}`)
      : this.http.put(`${this.api}/favorites/${slug}`, {});

    // The API said no (e.g. session ended): put the heart back as it was
    request.subscribe({ error: () => this.setOne(slug, wasFavorite) });
  }

  private load(): void {
    this.http.get<ApiResponse<string[]>>(`${this.api}/favorites/slugs`).subscribe({
      next: ({ data }) => {
        this.slugs.set(new Set(data));
        this.loaded.set(true);
      },
      error: () => undefined,
    });
  }

  private setOne(slug: string, favorite: boolean): void {
    this.slugs.update((current) => {
      const next = new Set(current);
      if (favorite) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }
}
