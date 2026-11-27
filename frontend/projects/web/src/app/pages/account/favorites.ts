import { Component, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { API_BASE_URL, type ApiResponse, type PlaceListItem } from '@seyyar/shared';
import { FavoritesService } from '../../core/favorites.service';
import { LanguageService } from '../../core/language';
import { PlaceCard } from '../../ui/place-card';
import { AccountNav } from './account-nav';

// /en/account/favorites
@Component({
  selector: 'app-favorites',
  imports: [RouterLink, TranslatePipe, PlaceCard, AccountNav],
  template: `
    <section
      class="mx-auto flex w-full max-w-[1200px] flex-col gap-gutter-lg px-page-margin py-gutter-xl"
    >
      <app-account-nav />
      <h1 class="text-headline-lg">{{ 'account.favoritesTitle' | translate }}</h1>

      @if (places().length > 0) {
        <div class="grid grid-cols-1 gap-gutter-lg sm:grid-cols-2 lg:grid-cols-3">
          @for (place of places(); track place.id) {
            <app-place-card [place]="place" />
          }
        </div>
      } @else if (list.isLoading()) {
        <div class="h-72 animate-pulse rounded-lg bg-sand/60"></div>
      } @else {
        <div
          class="flex flex-col items-center gap-gutter-md rounded-lg bg-surface-card p-gutter-xl text-center shadow-card"
        >
          <span
            class="material-symbols-outlined text-headline-lg text-terracotta"
            aria-hidden="true"
            >favorite</span
          >
          <p class="text-body-lg text-on-surface-variant">
            {{ 'account.noFavorites' | translate }}
          </p>
          <a [routerLink]="['/', lang()]" class="btn-primary">{{
            'account.explore' | translate
          }}</a>
        </div>
      }
    </section>
  `,
})
export class Favorites {
  private readonly api = inject(API_BASE_URL);
  private readonly favorites = inject(FavoritesService);
  protected readonly lang = inject(LanguageService).current;

  protected readonly list = httpResource<ApiResponse<PlaceListItem[]>>(() => ({
    url: `${this.api}/favorites`,
    params: { lang: this.lang(), limit: 50 },
  }));

  // A heart clicked off on this page removes the card at once
  protected readonly places = computed(() => {
    const places = this.list.hasValue() ? this.list.value().data : [];
    return this.favorites.loaded()
      ? places.filter((place) => this.favorites.isFavorite(place.slug))
      : places;
  });
}
