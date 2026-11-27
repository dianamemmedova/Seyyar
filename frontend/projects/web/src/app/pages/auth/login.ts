import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@seyyar/shared';
import { errorKey } from '../../core/error-key';
import { LanguageService } from '../../core/language';
import { AuthCard } from './auth-card';
import { passwordRules } from './password-rules';

// /en/auth/login and /en/auth/login?tab=register
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly lang = inject(LanguageService).current;

  // From the URL (withComponentInputBinding)
  readonly tab = input<'login' | 'register'>('login');
  readonly returnUrl = input<string>();

  protected readonly isRegister = computed(() => this.tab() === 'register');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^\+?[0-9\s-]{7,20}$/)],
    password: ['', passwordRules],
  });

  protected submit(): void {
    const form = this.isRegister() ? this.registerForm : this.loginForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request = this.isRegister()
      ? this.auth.register(this.registerValue())
      : this.auth.login(this.loginForm.getRawValue());

    request.subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() ?? `/${this.lang()}`),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorKey(err));
      },
    });
  }

  // The phone is optional: send it only when filled in
  private registerValue() {
    const { phone, ...rest } = this.registerForm.getRawValue();
    return phone.trim() ? { ...rest, phone: phone.trim() } : rest;
  }
}
