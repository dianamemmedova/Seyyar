import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ResetPassword } from './reset-password';

function type(page: HTMLElement, name: string, value: string) {
  const input = page.querySelector<HTMLInputElement>(`[formcontrolname=${name}]`)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('ResetPassword page', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  async function render(token?: string) {
    const fixture = TestBed.createComponent(ResetPassword);
    if (token) fixture.componentRef.setInput('token', token);
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('says the link is invalid when the URL has no token', async () => {
    const { page } = await render();
    expect(page.textContent).toContain('errors.INVALID_RESET_TOKEN');
    expect(page.querySelector('form')).toBeNull();
  });

  it('does not send two different passwords', async () => {
    const { fixture, page } = await render('a'.repeat(64));
    type(page, 'password', 'Password123');
    type(page, 'confirm', 'Password124');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    backend.expectNone('/api/auth/reset-password');
    expect(page.textContent).toContain('auth.passwordsDiffer');
  });

  it('saves the new password with the token from the link', async () => {
    const { fixture, page } = await render('token-from-email');
    type(page, 'password', 'Password123');
    type(page, 'confirm', 'Password123');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = backend.expectOne('/api/auth/reset-password');
    expect(req.request.body).toEqual({ token: 'token-from-email', password: 'Password123' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(page.textContent).toContain('auth.resetDone');
  });
});
