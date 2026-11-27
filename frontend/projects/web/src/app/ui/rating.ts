import { Component, input } from '@angular/core';

// ★ 4.8  (shows nothing while a place has no reviews yet)
@Component({
  selector: 'app-rating',
  template: `
    @if (count() > 0) {
      <span class="inline-flex shrink-0 items-center gap-1" [attr.aria-label]="value() + ' / 5'">
        <span class="material-symbols-outlined filled text-[16px] text-secondary" aria-hidden="true"
          >star</span
        >
        <span class="text-label-md text-on-surface tabular-nums">{{ value().toFixed(1) }}</span>
      </span>
    }
  `,
})
export class Rating {
  readonly value = input.required<number>();
  readonly count = input.required<number>();
}
