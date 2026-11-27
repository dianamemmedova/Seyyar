import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { API_BASE_URL } from '@seyyar/shared';
import { errorKey } from '../../core/error-key';
import { LanguageService } from '../../core/language';
import { AuthCard } from './auth-card';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard],
  template: `
    <app-auth-card [heading]="'auth.forgotTitle' | translate">
      @if (sent()) {
        <p
          class="rounded-md bg-sage-soft px-gutter-md py-gutter-sm text-body-md text-on-sage"
          role="status"
        >
          {{ 'auth.forgotSent' | translate }}
        </p>
      } @else {
        <p class="text-body-md text-on-surface-variant">{{ 'auth.forgotText' | translate }}</p>
        @if (error(); as message) {
          <p
            class="rounded-md bg-terracotta-soft px-gutter-md py-gutter-sm text-body-md text-error"
            role="alert"
          >
            {{ message | translate }}
          </p>
        }
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="flex flex-col gap-gutter-md"
          novalidate
        >
          <label class="field">
            <span class="text-label-lg">{{ 'auth.email' | translate }}</span>
            <input type="email" formControlName="email" autocomplete="email" class="input" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="text-body-sm text-error">{{ 'auth.emailError' | translate }}</span>
            }
          </label>
          <button type="submit" [disabled]="loading()" class="btn-primary">
            {{ (loading() ? 'common.wait' : 'auth.forgotButton') | translate }}
          </button>
        </form>
      }
      <a
        [routerLink]="['/', lang(), 'auth', 'login']"
        class="text-label-lg text-primary hover:underline"
        >{{ 'auth.backToLogin' | translate }}</a
      >
    </app-auth-card>
  `,
})
export class ForgotPassword {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  protected readonly lang = inject(LanguageService).current;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    // The API answers the same for known and unknown emails, so we always show "check your email"
    this.http.post(`${this.api}/auth/forgot-password`, this.form.getRawValue()).subscribe({
      next: () => this.sent.set(true),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorKey(err));
      },
    });
  }
}
