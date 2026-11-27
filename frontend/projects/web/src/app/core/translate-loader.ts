import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { from, Observable } from 'rxjs';

/**
 * Loads src/i18n/<lang>.json.
 * The files are bundled by the build (one small file per language), so this works the same
 * on the server (SSR) and in the browser, without an HTTP request.
 */
export class JsonTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return from(import(`../../i18n/${lang}.json`).then((module) => module.default));
  }
}
