import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { API_BASE_URL } from '@seyyar/shared';

// "Regions coming soon — notify me" (POST /api/subscribe)
@Component({
  selector: 'app-newsletter-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    @if (state() === 'done') {
      <p class="flex items-center gap-2 text-label-lg text-success" role="status">
        <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
        {{ 'home.regions.done' | translate }}
      </p>
    } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="flex w-full flex-col gap-2 lg:w-auto"
        novalidate
      >
        <div class="flex flex-col gap-3 sm:flex-row">
          <label for="newsletter-email" class="sr-only">{{
            'home.regions.email' | translate
          }}</label>
          <input
            id="newsletter-email"
            type="email"
            formControlName="email"
            placeholder="you@example.com"
            class="w-full rounded-md border border-outline bg-surface-card px-4 py-3 text-body-md outline-none placeholder:text-muted focus:border-primary sm:w-72"
          />
          <button
            type="submit"
            [disabled]="state() === 'sending'"
            class="shrink-0 rounded-md bg-primary px-5 py-3 text-label-lg text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {{ 'home.regions.notify' | translate }}
          </button>
        </div>
        @if (state() === 'invalid') {
          <p class="text-body-sm text-error">{{ 'home.regions.invalid' | translate }}</p>
        } @else if (state() === 'error') {
          <p class="text-body-sm text-error">{{ 'common.error' | translate }}</p>
        }
      </form>
    }
  `,
})
export class NewsletterForm {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  // (ngSubmit) only works when the <form> has a [formGroup]
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  protected readonly state = signal<'idle' | 'sending' | 'done' | 'invalid' | 'error'>('idle');

  protected submit(): void {
    if (this.form.invalid) {
      this.state.set('invalid');
      return;
    }

    this.state.set('sending');
    this.http
      .post(`${this.api}/subscribe`, { email: this.form.controls.email.value, interest: 'REGIONS' })
      .subscribe({
        next: () => this.state.set('done'),
        error: () => this.state.set('error'),
      });
  }
}
