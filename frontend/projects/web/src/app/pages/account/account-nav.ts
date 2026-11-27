import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/language';

// "My requests | Saved places" switch on top of the account pages
@Component({
  selector: 'app-account-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav class="flex gap-2" [attr.aria-label]="'nav.account' | translate">
      <a
        [routerLink]="['/', lang(), 'account', 'requests']"
        routerLinkActive="!bg-primary !text-on-primary"
        class="rounded-full bg-surface-card px-4 py-2 text-label-lg shadow-card"
        >{{ 'nav.myRequests' | translate }}</a
      >
      <a
        [routerLink]="['/', lang(), 'account', 'favorites']"
        routerLinkActive="!bg-primary !text-on-primary"
        class="rounded-full bg-surface-card px-4 py-2 text-label-lg shadow-card"
        >{{ 'nav.favorites' | translate }}</a
      >
    </nav>
  `,
})
export class AccountNav {
  protected readonly lang = inject(LanguageService).current;
}
