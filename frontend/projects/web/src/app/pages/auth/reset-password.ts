import { Component, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { API_BASE_URL } from '@seyyar/shared';
import { errorKey } from '../../core/error-key';
import { LanguageService } from '../../core/language';
import { AuthCard } from './auth-card';
import { passwordRules, passwordsMatch } from './password-rules';

// The link from the email: /en/auth/reset-password?token=...
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard],
  template: `
    <app-auth-card [heading]="'auth.resetTitle' | translate">
      @if (done()) {
        <p
          class="rounded-md bg-sage-soft px-gutter-md py-gutter-sm text-body-md text-on-sage"
          role="status"
        >
          {{ 'auth.resetDone' | translate }}
        </p>
        <a [routerLink]="['/', lang(), 'auth', 'login']" class="btn-primary text-center">{{
          'auth.loginButton' | translate
        }}</a>
      } @else if (!token()) {
        <p class="text-body-md text-error">{{ 'errors.INVALID_RESET_TOKEN' | translate }}</p>
      } @else {
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
            <span class="text-label-lg">{{ 'auth.newPassword' | translate }}</span>
            <input
              type="password"
              formControlName="password"
              autocomplete="new-password"
              class="input"
            />
            <span
              class="text-body-sm"
              [class]="
                form.controls.password.touched && form.controls.password.invalid
                  ? 'text-error'
                  : 'text-muted'
              "
              >{{ 'auth.passwordRules' | translate }}</span
            >
          </label>
          <label class="field">
            <span class="text-label-lg">{{ 'auth.repeatPassword' | translate }}</span>
            <input
              type="password"
              formControlName="confirm"
              autocomplete="new-password"
              class="input"
            />
            @if (form.controls.confirm.touched && form.hasError('passwordsDiffer')) {
              <span class="text-body-sm text-error">{{ 'auth.passwordsDiffer' | translate }}</span>
            }
          </label>
          <button type="submit" [disabled]="loading()" class="btn-primary">
            {{ (loading() ? 'common.wait' : 'auth.resetButton') | translate }}
          </button>
        </form>
      }
    </app-auth-card>
  `,
})
export class ResetPassword {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);
  protected readonly lang = inject(LanguageService).current;

  readonly token = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group(
    { password: ['', passwordRules], confirm: [''] },
    { validators: passwordsMatch },
  );
  protected readonly loading = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const body = { token: this.token(), password: this.form.controls.password.value };
    this.http.post(`${this.api}/auth/reset-password`, body).subscribe({
      next: () => this.done.set(true),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorKey(err));
      },
    });
  }
}
