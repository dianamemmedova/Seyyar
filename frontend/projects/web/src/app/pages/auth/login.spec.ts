import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/language';
import { Login } from './login';

const session = {
  accessToken: 't',
  user: {
    id: 1,
    email: 'a@b.az',
    fullName: 'Diana M',
    phone: null,
    role: 'TOURIST',
    language: 'en',
    currency: 'AZN',
    createdAt: '',
  },
};

function type(page: HTMLElement, name: string, value: string) {
  const input = page.querySelector<HTMLInputElement>(`[formcontrolname=${name}]`)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('Login page', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(LanguageService).current.set('ru');
  });

  async function render(inputs: { tab?: 'login' | 'register'; returnUrl?: string } = {}) {
    const fixture = TestBed.createComponent(Login);
    if (inputs.tab) fixture.componentRef.setInput('tab', inputs.tab);
    if (inputs.returnUrl) fixture.componentRef.setInput('returnUrl', inputs.returnUrl);
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('logs in and goes back to the page the user came from', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { page } = await render({ returnUrl: '/ru/account/favorites' });

    type(page, 'email', 'a@b.az');
    type(page, 'password', 'Password123');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    backend.expectOne('/api/auth/login').flush({ data: session });
    expect(navigate).toHaveBeenCalledWith('/ru/account/favorites');
  });

  it('goes to the home page in the current language without returnUrl', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { page } = await render();

    type(page, 'email', 'a@b.az');
    type(page, 'password', 'x');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    backend.expectOne('/api/auth/login').flush({ data: session });
    expect(navigate).toHaveBeenCalledWith('/ru');
  });

  it('checks the password rules before calling the API', async () => {
    const { fixture, page } = await render({ tab: 'register' });

    type(page, 'fullName', 'Diana');
    type(page, 'email', 'a@b.az');
    type(page, 'password', 'onlyletters');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    backend.expectNone('/api/auth/register');
    expect(page.querySelector('.text-error')?.textContent).toContain('auth.passwordRules');
  });

  it('sends the phone only when it is filled in', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { page } = await render({ tab: 'register' });

    type(page, 'fullName', 'Diana');
    type(page, 'email', 'a@b.az');
    type(page, 'password', 'Password123');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = backend.expectOne('/api/auth/register');
    expect(req.request.body).toEqual({
      fullName: 'Diana',
      email: 'a@b.az',
      password: 'Password123',
    });
    req.flush({ data: session });
  });

  it('shows a translated message for a known API error', async () => {
    const { fixture, page } = await render({ tab: 'register' });

    type(page, 'fullName', 'Diana');
    type(page, 'email', 'a@b.az');
    type(page, 'password', 'Password123');
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    backend
      .expectOne('/api/auth/register')
      .flush(
        { error: { code: 'EMAIL_TAKEN', message: 'x', requestId: 'r' } },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(page.querySelector('[role=alert]')!.textContent).toContain('errors.EMAIL_TAKEN');
  });
});
