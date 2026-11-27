import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Room } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { AznPipe } from '../../ui/azn.pipe';

// Hotel rooms with price per night and a "Send request" button for each room
@Component({
  selector: 'app-rooms-list',
  imports: [RouterLink, TranslatePipe, AznPipe],
  template: `
    <ul class="flex flex-col gap-gutter-md">
      @for (room of rooms(); track room.id) {
        <li
          class="flex flex-col gap-gutter-md overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-card sm:flex-row"
        >
          @if (room.photos[0]; as photo) {
            <img
              [src]="photo"
              [alt]="room.name"
              loading="lazy"
              class="h-44 w-full object-cover sm:h-auto sm:w-56"
            />
          }
          <div class="flex flex-1 flex-col gap-gutter-sm p-gutter-md">
            <h3 class="text-title-md">{{ room.name }}</h3>
            @if (room.description) {
              <p class="text-body-md text-on-surface-variant">
                {{ room.description }}
              </p>
            }
            <ul class="flex flex-wrap gap-x-gutter-md gap-y-1 text-body-sm text-on-surface-variant">
              <li class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true">group</span>
                {{ 'detail.room.guests' | translate: { count: room.maxGuests } }}
              </li>
              @if (room.sizeM2) {
                <li class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >square_foot</span
                  >
                  {{ room.sizeM2 }} m²
                </li>
              }
              @if (room.bedType) {
                <li class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true">bed</span>
                  {{ room.bedType }}
                </li>
              }
              @if (room.breakfastIncluded) {
                <li class="flex items-center gap-1 text-success">
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >free_breakfast</span
                  >
                  {{ 'detail.room.breakfast' | translate }}
                </li>
              }
              @if (room.freeCancellation) {
                <li class="flex items-center gap-1 text-success">
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >event_available</span
                  >
                  {{ 'detail.room.freeCancellation' | translate }}
                </li>
              }
            </ul>
            <div
              class="mt-auto flex flex-wrap items-center justify-between gap-gutter-sm pt-gutter-sm"
            >
              <p>
                <span class="text-title-md text-primary tabular-nums">{{
                  room.pricePerNight | azn
                }}</span>
                <span class="text-body-sm text-muted"> / {{ 'card.night' | translate }}</span>
              </p>
              <a
                class="btn-primary"
                [routerLink]="['/', lang(), 'hotels', slug(), 'request']"
                [queryParams]="{ room: room.id }"
                >{{ 'detail.room.request' | translate }}</a
              >
            </div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class RoomsList {
  protected readonly lang = inject(LanguageService).current;

  readonly slug = input.required<string>();
  readonly rooms = input.required<Room[]>();
}
