import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { OpeningHours as Hours } from '@seyyar/shared';
import { LanguageService } from '../../core/language';

// Monday first, like people in Baku read a week
const WEEK = [1, 2, 3, 4, 5, 6, 0];

// 2026-11-01 was a Sunday: day 0 + n gives a date with that weekday
const dayName = (day: number, lang: string) =>
  new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, 10, 1 + day)),
  );

// Day of the week in Baku (0 = Sunday), wherever the visitor's computer is
export function bakuWeekday(now: Date): number {
  const short = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Baku',
  }).format(now);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
}

// Opening hours table: Monday 10:00 – 23:00 / Closed
@Component({
  selector: 'app-opening-hours',
  imports: [TranslatePipe],
  template: `
    <table class="w-full text-body-md">
      <tbody>
        @for (row of rows(); track row.day) {
          <tr
            class="border-b border-outline-variant/60 last:border-0"
            [class.font-semibold]="row.isToday"
          >
            <th scope="row" class="py-2 pr-4 text-left font-normal capitalize">
              {{ row.name }}
            </th>
            <td class="py-2 text-right tabular-nums">
              @if (row.hours && !row.hours.isClosed) {
                {{ row.hours.opensAt }} – {{ row.hours.closesAt }}
              } @else {
                <span class="text-muted">{{ 'detail.closedDay' | translate }}</span>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class OpeningHours {
  private readonly lang = inject(LanguageService).current;

  readonly hours = input.required<Hours[]>();

  protected readonly rows = computed(() => {
    const today = bakuWeekday(new Date());
    return WEEK.map((day) => ({
      day,
      name: dayName(day, this.lang()),
      hours: this.hours().find((row) => row.dayOfWeek === day) ?? null,
      isToday: day === today,
    }));
  });
}
