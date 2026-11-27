import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { DOCUMENT } from '@angular/core';
import { langGuard, LanguageService } from './language';

// Calls the guard the way the router does
function runGuard(lang: string, url: string) {
  const route = { paramMap: new Map([['lang', lang]]) } as unknown as ActivatedRouteSnapshot;
  return TestBed.runInInjectionContext(() => langGuard(route, { url } as RouterStateSnapshot));
}

describe('langGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en' })],
    });
    // No real JSON files in unit tests
    vi.spyOn(TestBed.inject(TranslateService), 'use').mockReturnValue(of({}));
  });

  it('accepts a supported language and switches to it', async () => {
    const result = runGuard('ru', '/ru/hotels');

    expect(isObservable(result)).toBe(true);
    expect(await firstValueFrom(result as never)).toBe(true);
    expect(TestBed.inject(LanguageService).current()).toBe('ru');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('ru');
  });

  it.each([
    ['hotels', '/hotels?page=2', '/en/hotels?page=2'],
    ['de', '/de/hotels', '/en/hotels'],
    ['xx', '/xx', '/en'],
  ])('redirects "%s" (%s) to %s', (lang, url, expected) => {
    const result = runGuard(lang, url) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe(expected);
  });
});

describe('LanguageService.switchUrl', () => {
  it('keeps the page and the query, changes only the language', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const language = TestBed.inject(LanguageService);

    expect(language.switchUrl('/en/hotels?page=2', 'az')).toBe('/az/hotels?page=2');
    expect(language.switchUrl('/en', 'ru')).toBe('/ru');
  });
});
