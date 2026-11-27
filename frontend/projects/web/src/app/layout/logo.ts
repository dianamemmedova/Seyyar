import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="flex items-center gap-2.5">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-md"
        [class]="inverted() ? 'bg-primary text-on-primary' : 'bg-sage text-on-sage'"
      >
        <span class="material-symbols-outlined text-[22px]" aria-hidden="true">explore</span>
      </span>
      <span class="text-headline-sm font-bold tracking-tight text-primary">Seyyar</span>
    </span>
  `,
})
export class Logo {
  // Footer version: dark square on the sand background
  readonly inverted = input(false);
}
