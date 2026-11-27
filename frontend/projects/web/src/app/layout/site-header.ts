import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { AuthService, LANGS, type Lang } from '@seyyar/shared';
import { LanguageService } from '../core/language';
import { Logo } from './logo';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Logo],
  templateUrl: './site-header.html',
})
export class SiteHeader {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly langs = LANGS;
  protected readonly lang = this.language.current;

  // Which menu is open: the mobile drawer, the language list or the user menu
  protected readonly openMenu = signal<'mobile' | 'language' | 'user' | null>(null);

  // The current address, so the language switch keeps the user on the same page
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');

  constructor() {
    // Every navigation closes the open menu
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.openMenu.set(null));
  }

  protected toggle(menu: 'mobile' | 'language' | 'user'): void {
    this.openMenu.update((open) => (open === menu ? null : menu));
  }

  protected languageUrl(lang: Lang): string {
    return this.language.switchUrl(this.url(), lang);
  }

  // A real link (good for Google), but opened by the router without reloading the page
  protected switchLanguage(event: MouseEvent, lang: Lang): void {
    event.preventDefault();
    this.router.navigateByUrl(this.languageUrl(lang));
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/', this.lang()]));
  }
}
