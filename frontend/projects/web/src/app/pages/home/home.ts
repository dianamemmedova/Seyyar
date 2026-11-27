import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, of } from 'rxjs';
import { API_BASE_URL, LANGS } from '@seyyar/shared';
import { LanguageService } from '../../core/language';

// Temporary home page for F1: proves that SSR, translations, Tailwind and the API work together.
// The real home page comes in the next step.
@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  protected readonly language = inject(LanguageService);
  protected readonly langs = LANGS;

  protected readonly apiOk = toSignal(
    this.http.get<{ status: string }>(`${this.api}/health`).pipe(
      map((res) => res.status === 'ok'),
      catchError(() => of(false)),
    ),
  );
}
