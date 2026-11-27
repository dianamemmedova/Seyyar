import { Component, input } from '@angular/core';

// White card in the middle of the page, used by all auth pages
@Component({
  selector: 'app-auth-card',
  template: `
    <section class="mx-auto flex w-full max-w-md flex-col gap-gutter-lg px-page-margin py-section">
      <div class="flex flex-col gap-gutter-md rounded-lg bg-surface-card p-gutter-xl shadow-card">
        <h1 class="text-headline-md">{{ heading() }}</h1>
        <ng-content />
      </div>
    </section>
  `,
})
export class AuthCard {
  readonly heading = input.required<string>();
}
