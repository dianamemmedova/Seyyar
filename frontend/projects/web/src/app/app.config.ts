import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import localeAz from '@angular/common/locales/az';
import localeRu from '@angular/common/locales/ru';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { AuthService, authInterceptor } from '@seyyar/shared';
import { routes } from './app.routes';
import { DEFAULT_LANG } from './core/language';
import { JsonTranslateLoader } from './core/translate-loader';

// Month and day names for the date pipe: {{ date | date: 'd MMM' : undefined : 'ru' }}
registerLocaleData(localeRu, 'ru');
registerLocaleData(localeAz, 'az');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params (:lang, :slug) arrive straight into component inputs
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateLoader(JsonTranslateLoader),
      fallbackLang: DEFAULT_LANG,
    }),
    // In the browser: log the user back in after a page reload (the server never has the cookie)
    provideAppInitializer(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        return inject(AuthService).restoreSession();
      }
      return undefined;
    }),
  ],
};
