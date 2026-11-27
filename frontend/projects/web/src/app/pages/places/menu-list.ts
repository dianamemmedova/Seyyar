import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlaceDetail } from '@seyyar/shared';
import { AznPipe } from '../../ui/azn.pipe';

// Restaurant menu grouped by category. Finished dishes stay in the list, greyed out.
@Component({
  selector: 'app-menu-list',
  imports: [TranslatePipe, AznPipe],
  template: `
    <div class="flex flex-col gap-gutter-lg">
      @for (category of menu(); track category.id) {
        <section class="flex flex-col gap-gutter-sm">
          <h3 class="text-title-md">{{ category.name }}</h3>
          <ul
            class="flex flex-col divide-y divide-outline-variant/60 rounded-lg border border-outline-variant/60 bg-surface-card"
          >
            @for (item of category.items; track item.id) {
              <li class="flex gap-gutter-md p-gutter-md" [class.opacity-50]="!item.isAvailable">
                @if (item.photo) {
                  <img
                    [src]="item.photo"
                    [alt]="item.name"
                    loading="lazy"
                    class="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                }
                <div class="min-w-0 flex-1">
                  <p class="text-label-lg">
                    {{ item.name }}
                    @if (item.isSet) {
                      <span
                        class="ml-1 rounded-full bg-secondary-container px-2 py-0.5 text-label-sm text-on-secondary-container"
                        >{{ 'detail.menu.set' | translate }}</span
                      >
                    }
                  </p>
                  @if (item.description) {
                    <p class="text-body-sm text-on-surface-variant">
                      {{ item.description }}
                    </p>
                  }
                  <p class="text-body-sm text-muted">
                    @if (item.weightGrams) {
                      {{ item.weightGrams }} g
                    }
                    @if (!item.isAvailable) {
                      · {{ 'detail.menu.unavailable' | translate }}
                    }
                  </p>
                </div>
                <p class="shrink-0 text-label-lg text-primary tabular-nums">
                  {{ item.price | azn }}
                </p>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class MenuList {
  readonly menu = input.required<PlaceDetail['menu']>();
}
