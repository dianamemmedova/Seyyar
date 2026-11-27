import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/language';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe],
  template: `
    <main
      class="mx-auto flex min-h-screen max-w-[1200px] flex-col items-start justify-center gap-gutter-md px-page-margin"
    >
      <span class="material-symbols-outlined text-headline-lg text-sage">explore_off</span>
      <h1 class="text-headline-lg">{{ 'notFound.title' | translate }}</h1>
      <p class="text-body-lg text-on-surface-variant">{{ 'notFound.text' | translate }}</p>
      <a
        [routerLink]="['/', language.current()]"
        class="rounded-md bg-primary px-5 py-3 text-label-lg text-on-primary"
      >
        {{ 'common.backHome' | translate }}
      </a>
    </main>
  `,
})
export class NotFound {
  protected readonly language = inject(LanguageService);
}
