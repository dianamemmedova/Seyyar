import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';

const user = (role: string) => ({
  id: 1,
  email: 'a@seyyar.test',
  fullName: 'A',
  phone: null,
  role,
  language: 'az',
  currency: 'AZN',
  createdAt: '',
});

describe('Login', () => {
  let backend: HttpTestingController;

  async function fillAndSubmit() {
    const fixture = TestBed.createComponent(Login);
    const page = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    const email = page.querySelector<HTMLInputElement>('input[type=email]')!;
    const password = page.querySelector<HTMLInputElement>('input[type=password]')!;
    email.value = 'admin@seyyar.test';
    email.dispatchEvent(new Event('input'));
    password.value = 'Password123';
    password.dispatchEvent(new Event('input'));
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    return { fixture, page };
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  it('does not call the API while the form is empty', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    backend.expectNone('/api/auth/login');
    expect(fixture.nativeElement.textContent).toContain('Düzgün e-poçt ünvanı yazın.');
  });

  it('opens the panel for an admin', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fillAndSubmit();

    backend.expectOne('/api/auth/login').flush({ data: { user: user('ADMIN'), accessToken: 't' } });
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows the API error in Azerbaijani', async () => {
    const { fixture, page } = await fillAndSubmit();

    backend
      .expectOne('/api/auth/login')
      .flush(
        { error: { code: 'INVALID_CREDENTIALS', message: 'x', requestId: 'r' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    await fixture.whenStable();

    expect(page.textContent).toContain('E-poçt və ya şifrə yanlışdır.');
  });

  it('refuses tourist accounts and logs them out again', async () => {
    const { fixture, page } = await fillAndSubmit();

    backend
      .expectOne('/api/auth/login')
      .flush({ data: { user: user('TOURIST'), accessToken: 't' } });
    backend.expectOne('/api/auth/logout').flush(null);
    await fixture.whenStable();

    expect(page.textContent).toContain('Bu hesabın admin panelə girişi yoxdur.');
  });
});
