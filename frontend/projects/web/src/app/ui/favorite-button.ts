import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@seyyar/shared';
import { FavoritesService } from '../core/favorites.service';
import { LanguageService } from '../core/language';

// The heart on a place card. Visitors who are not logged in are sent to the login page.
@Component({
  selector: 'app-favorite-button',
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      (click)="toggle()"
      [attr.aria-pressed]="favorites.isFavorite(slug())"
      [attr.aria-label]="'card.save' | translate"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card/90 transition-colors hover:bg-surface-card"
      [class]="favorites.isFavorite(slug()) ? 'text-terracotta' : 'text-on-surface'"
    >
      <span
        class="material-symbols-outlined text-[18px]"
        [class.filled]="favorites.isFavorite(slug())"
        aria-hidden="true"
        >favorite</span
      >
    </button>
  `,
})
export class FavoriteButton {
  protected readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  readonly slug = input.required<string>();

  protected toggle(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/', this.language.current(), 'auth', 'login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    this.favorites.toggle(this.slug());
  }
}
