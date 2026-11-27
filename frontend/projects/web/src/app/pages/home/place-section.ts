import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlaceListItem } from '@seyyar/shared';
import { PlaceCard } from '../../ui/place-card';

// "Recommended hotels  [See all >]" + three place cards
@Component({
  selector: 'app-place-section',
  imports: [RouterLink, TranslatePipe, PlaceCard],
  template: `
    @if (places().length > 0) {
      <section class="mx-auto flex w-full max-w-[1200px] flex-col gap-gutter-lg px-page-margin">
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 class="text-headline-md">{{ title() | translate }}</h2>
            <p class="text-body-md text-on-surface-variant">{{ subtitle() | translate }}</p>
          </div>
          <a
            [routerLink]="seeAllLink()"
            class="inline-flex shrink-0 items-center gap-1 text-label-lg text-primary hover:underline"
          >
            {{ 'home.seeAll' | translate }}
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >chevron_right</span
            >
          </a>
        </div>
        <div class="grid grid-cols-1 gap-gutter-lg md:grid-cols-3">
          @for (place of places().slice(0, 3); track place.id) {
            <app-place-card [place]="place" />
          }
        </div>
      </section>
    }
  `,
})
export class PlaceSection {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly places = input.required<PlaceListItem[]>();
  readonly seeAllLink = input.required<string[]>();
}
