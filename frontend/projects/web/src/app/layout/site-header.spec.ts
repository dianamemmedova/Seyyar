import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { AuthService } from '@seyyar/shared';
import { LanguageService } from '../core/language';
import { SiteHeader } from './site-header';

@Component({ template: '' })
class Blank {}

describe('SiteHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: Blank }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    TestBed.inject(LanguageService).current.set('en');
  });

  async function render() {
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('shows "Log in" for visitors', async () => {
    const { page } = await render();
    expect(page.querySelector('a[href="/en/login"]')).not.toBeNull();
  });

  it('shows the first name and the user menu after login', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login({ email: 'a', password: 'b' }).subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush({
        data: {
          accessToken: 't',
          user: {
            id: 1,
            email: 'a',
            fullName: 'Diana Mammadova',
            phone: null,
            role: 'TOURIST',
            language: 'en',
            currency: 'AZN',
            createdAt: '',
          },
        },
      });

    const { fixture, page } = await render();
    expect(page.querySelector('a[href="/en/login"]')).toBeNull();
    expect(page.textContent).toContain('Diana');

    // Open the user menu
    const userButton = [...page.querySelectorAll('button')].find((b) =>
      b.textContent!.includes('Diana'),
    )!;
    userButton.click();
    await fixture.whenStable();
    expect(page.querySelector('a[href="/en/account/requests"]')).not.toBeNull();
  });

  it('keeps the current page when switching the language', async () => {
    await TestBed.inject(Router).navigateByUrl('/en/hotels?page=2');
    const { fixture, page } = await render();

    page.querySelector<HTMLButtonElement>('button[aria-expanded]')!.click();
    await fixture.whenStable();

    const russian = page.querySelector('a[lang="ru"]')!;
    expect(russian.getAttribute('href')).toBe('/ru/hotels?page=2');
  });
});
