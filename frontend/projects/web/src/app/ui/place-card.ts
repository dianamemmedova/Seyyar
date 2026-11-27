import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlaceListItem } from '@seyyar/shared';
import { LanguageService } from '../core/language';
import { placeLink } from '../core/place-routes';
import { AznPipe } from './azn.pipe';
import { FavoriteButton } from './favorite-button';
import { Rating } from './rating';

// The card used everywhere a place is listed (home page, search results, favorites)
@Component({
  selector: 'app-place-card',
  imports: [RouterLink, TranslatePipe, AznPipe, Rating, FavoriteButton],
  templateUrl: './place-card.html',
})
export class PlaceCard {
  private readonly language = inject(LanguageService);

  readonly place = input.required<PlaceListItem>();

  protected readonly link = computed(() =>
    placeLink(this.language.current(), this.place().type, this.place().slug),
  );

  // Restaurants show their price level as ₼, ₼₼ or ₼₼₼
  protected readonly priceLevel = computed(() => '₼'.repeat(this.place().priceLevel ?? 0));
}
