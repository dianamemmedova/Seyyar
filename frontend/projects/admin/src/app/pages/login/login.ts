import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, toApiError } from '@seyyar/shared';

// API error codes -> messages for the admin (Azerbaijani)
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-poçt və ya şifrə yanlışdır.',
  ACCOUNT_BLOCKED: 'Bu hesab bloklanıb.',
  TOO_MANY_REQUESTS: 'Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın.',
  NETWORK_ERROR: 'Serverlə əlaqə yoxdur. Backend işləyir?',
  NOT_ADMIN: 'Bu hesabın admin panelə girişi yoxdur.',
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ?returnUrl=/places — where the admin wanted to go before login.
  // Without the query value the router sets undefined, so the fallback is in submit().
  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        if (user.role !== 'ADMIN') {
          // A tourist account cannot use the admin panel: close the session again
          this.auth.logout().subscribe();
          this.fail('NOT_ADMIN');
          return;
        }
        this.router.navigateByUrl(this.returnUrl() ?? '/');
      },
      error: (err: unknown) => this.fail(toApiError(err).code),
    });
  }

  private fail(code: string): void {
    this.loading.set(false);
    this.error.set(ERROR_MESSAGES[code] ?? 'Xəta baş verdi. Yenidən cəhd edin.');
  }
}
