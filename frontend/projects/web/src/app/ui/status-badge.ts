import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { RequestStatus } from '@seyyar/shared';

const COLORS: Record<RequestStatus, string> = {
  NEW: 'bg-secondary-container text-on-secondary-container',
  CONFIRMED: 'bg-primary-container text-on-primary-container',
  ARRIVED: 'bg-sage-soft text-on-sage',
  DECLINED: 'bg-terracotta-soft text-error',
  NO_SHOW: 'bg-terracotta-soft text-error',
  EXPIRED: 'bg-sand text-on-surface-variant',
  CANCELLED: 'bg-sand text-on-surface-variant',
};

@Component({
  selector: 'app-status-badge',
  imports: [TranslatePipe],
  template: `<span class="inline-flex rounded-full px-2.5 py-1 text-label-md" [class]="color()">{{
    'status.' + status() | translate
  }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<RequestStatus>();
  protected readonly color = computed(() => COLORS[this.status()]);
}
