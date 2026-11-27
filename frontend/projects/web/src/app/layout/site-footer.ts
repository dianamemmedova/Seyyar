import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../core/language';
import { Logo } from './logo';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, TranslatePipe, Logo],
  template: `
    <footer class="border-t border-outline bg-sand text-on-sand">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-10 px-page-margin py-12">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div class="flex flex-col gap-3 md:col-span-4">
            <app-logo [inverted]="true" />
            <p class="max-w-xs text-body-md text-on-surface-variant">
              {{ 'footer.about' | translate }}
            </p>
          </div>

          <div class="flex flex-col gap-3 md:col-span-3">
            <h2 class="text-title-md">{{ 'footer.explore' | translate }}</h2>
            <ul class="flex flex-col gap-2 text-body-md text-on-surface-variant">
              @for (item of navItems; track item.path) {
                <li>
                  <a
                    [routerLink]="['/', lang(), item.path]"
                    class="transition-colors hover:text-primary"
                    >{{ item.label | translate }}</a
                  >
                </li>
              }
            </ul>
          </div>

          <div class="flex flex-col gap-3 md:col-span-3">
            <h2 class="text-title-md">{{ 'footer.business' | translate }}</h2>
            <ul class="flex flex-col gap-2 text-body-md text-on-surface-variant">
              <li>
                <a
                  [routerLink]="['/', lang(), 'partners']"
                  class="transition-colors hover:text-primary"
                  >{{ 'nav.becomePartner' | translate }}</a
                >
              </li>
              <li>
                <a
                  [routerLink]="['/', lang(), 'drivers']"
                  class="transition-colors hover:text-primary"
                  >{{ 'footer.drivers' | translate }}</a
                >
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-3 md:col-span-2">
            <h2 class="text-title-md">{{ 'footer.help' | translate }}</h2>
            <ul class="flex flex-col gap-2 text-body-md text-on-surface-variant">
              <li>
                <a
                  [routerLink]="['/', lang(), 'faq']"
                  class="transition-colors hover:text-primary"
                  >{{ 'footer.faq' | translate }}</a
                >
              </li>
              <li>
                <a
                  [routerLink]="['/', lang(), 'contact']"
                  class="transition-colors hover:text-primary"
                  >{{ 'footer.contact' | translate }}</a
                >
              </li>
            </ul>
          </div>
        </div>

        <p class="border-t border-outline pt-6 text-body-sm text-on-surface-variant">
          © {{ year }} Seyyar. {{ 'footer.madeFor' | translate }}
        </p>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  protected readonly lang = inject(LanguageService).current;
  protected readonly navItems = NAV_ITEMS;
  protected readonly year = new Date().getFullYear();
}
