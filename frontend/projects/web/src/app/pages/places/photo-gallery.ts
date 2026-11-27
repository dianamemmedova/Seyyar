import { Component, computed, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlaceDetail } from '@seyyar/shared';

// One big photo + a row of thumbnails. A thumbnail click shows that photo big.
@Component({
  selector: 'app-photo-gallery',
  imports: [TranslatePipe],
  template: `
    @if (photos().length > 0) {
      <div class="flex flex-col gap-gutter-sm">
        <div class="aspect-video overflow-hidden rounded-lg bg-sand md:aspect-[21/9]">
          <img
            [src]="current().url"
            [alt]="current().alt ?? name()"
            class="h-full w-full object-cover"
          />
        </div>
        @if (photos().length > 1) {
          <div class="flex gap-gutter-sm overflow-x-auto pb-1">
            @for (photo of photos(); track photo.url; let i = $index) {
              <button
                type="button"
                class="h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-opacity"
                [class]="
                  i === active()
                    ? 'border-primary'
                    : 'border-transparent opacity-70 hover:opacity-100'
                "
                [attr.aria-label]="'detail.photo' | translate: { n: i + 1 }"
                [attr.aria-current]="i === active()"
                (click)="active.set(i)"
              >
                <img [src]="photo.url" alt="" loading="lazy" class="h-full w-full object-cover" />
              </button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class PhotoGallery {
  readonly photos = input.required<PlaceDetail['photos']>();
  readonly name = input.required<string>();

  protected readonly active = signal(0);
  protected readonly current = computed(() => this.photos()[this.active()] ?? this.photos()[0]);
}
