import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  API_BASE_URL,
  type ApiResponse,
  type PageMeta,
  type RequestListItem,
  type RequestTab,
} from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { AznPipe } from '../../ui/azn.pipe';
import { StatusBadge } from '../../ui/status-badge';
import { AccountNav } from './account-nav';

const TABS: RequestTab[] = ['active', 'past', 'cancelled'];

// /en/account/requests?status=past&page=2
@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, DatePipe, TranslatePipe, AznPipe, StatusBadge, AccountNav],
  templateUrl: './my-requests.html',
})
export class MyRequests {
  private readonly api = inject(API_BASE_URL);
  protected readonly lang = inject(LanguageService).current;
  protected readonly tabs = TABS;

  // From the URL query. A missing query value arrives as undefined (not as the default),
  // so the transforms turn anything unknown into the first tab / first page.
  readonly status = input('active' as RequestTab, {
    transform: (value: unknown): RequestTab =>
      TABS.includes(value as RequestTab) ? (value as RequestTab) : 'active',
  });
  readonly page = input(1, { transform: (value: unknown) => numberAttribute(value, 1) });

  protected readonly requests = httpResource<ApiResponse<RequestListItem[], PageMeta>>(() => ({
    url: `${this.api}/requests/my`,
    params: { status: this.status(), page: this.page(), limit: 10, lang: this.lang() },
  }));

  protected readonly items = computed(() =>
    this.requests.hasValue() ? this.requests.value().data : [],
  );
  protected readonly meta = computed(() =>
    this.requests.hasValue() ? this.requests.value().meta : null,
  );
}
