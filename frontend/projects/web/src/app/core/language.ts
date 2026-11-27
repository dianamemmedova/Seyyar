import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { LANGS, type Lang } from '@seyyar/shared';

export const DEFAULT_LANG: Lang = 'en';

export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

// The current language of the website. The URL decides it: /en/..., /ru/..., /az/...
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly current = signal<Lang>(DEFAULT_LANG);

  use(lang: Lang): Observable<Lang> {
    this.current.set(lang);
    this.document.documentElement.lang = lang;
    return this.translate.use(lang).pipe(map(() => lang));
  }

  // The same page in another language: /en/hotels?page=2 -> /ru/hotels?page=2
  switchUrl(url: string, lang: Lang): string {
    const [, , ...rest] = url.split('/');
    return `/${[lang, ...rest].join('/')}`;
  }
}

/**
 * Runs before every page:
 * - /ru/... : loads the Russian texts, then shows the page (so SSR sends translated HTML);
 * - /hotels or /xx/hotels : redirects to the same page in English (/en/hotels).
 */
export const langGuard: CanActivateFn = (route, state) => {
  const lang = route.paramMap.get('lang');

  if (!isLang(lang)) {
    const segments = state.url.split('/').filter(Boolean);
    // "/xx/hotels": an unknown language code is replaced; "/hotels": the whole path is kept
    if (lang?.length === 2) segments.shift();
    return inject(Router).parseUrl('/' + [DEFAULT_LANG, ...segments].join('/'));
  }

  return inject(LanguageService)
    .use(lang)
    .pipe(map(() => true));
};
