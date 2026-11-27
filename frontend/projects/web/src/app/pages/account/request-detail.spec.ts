import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import type { RequestDetail as Detail } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { RequestDetail } from './request-detail';

const detail: Detail = {
  code: 'TRZ-123456',
  type: 'HOTEL',
  status: 'NEW',
  place: {
    slug: 'sea-hotel',
    type: 'HOTEL',
    name: 'Sea Hotel',
    coverPhoto: null,
    address: 'Baku',
    phone: '+994501112233',
    whatsapp: '+994501112233',
    lat: 40.4,
    lng: 49.8,
  },
  dateFrom: '2026-12-20',
  dateTo: '2026-12-23',
  time: null,
  nights: 3,
  guests: 2,
  children: 0,
  totalEstimate: 360,
  canCancel: true,
  createdAt: '',
  contact: { name: 'Diana', email: 'd@x.az', phone: '+994', whatsapp: true },
  note: null,
  specialRequests: [],
  items: [
    {
      id: 1,
      kind: 'ROOM',
      name: 'Standard',
      quantity: 1,
      unitPrice: 120,
      lineTotal: 120,
      note: null,
    },
  ],
  declineReason: null,
  respondedAt: null,
  cancelledAt: null,
  canReview: false,
  messages: [],
};

describe('RequestDetail page', () => {
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
    TestBed.inject(LanguageService).current.set('en');
  });

  async function render(data: Detail = detail) {
    const fixture = TestBed.createComponent(RequestDetail);
    fixture.componentRef.setInput('code', 'TRZ-123456');
    TestBed.tick();
    backend.expectOne('/api/requests/TRZ-123456?lang=en').flush({ data });
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('shows the request and the place contacts', async () => {
    const { page } = await render();
    expect(page.textContent).toContain('Sea Hotel');
    expect(page.textContent).toContain('status.NEW');
    expect(page.querySelector('a[href="tel:+994501112233"]')).not.toBeNull();
    expect(page.querySelector('a[href="https://wa.me/994501112233"]')).not.toBeNull();
  });

  it('sends a message and shows it at once', async () => {
    const { fixture, page } = await render();

    const input = page.querySelector<HTMLInputElement>('#message-text')!;
    input.value = '  Late check-in?  ';
    input.dispatchEvent(new Event('input'));
    input.closest('form')!.dispatchEvent(new Event('submit'));

    const req = backend.expectOne('/api/requests/TRZ-123456/messages');
    expect(req.request.body).toEqual({ text: 'Late check-in?' });
    req.flush({
      data: {
        id: 9,
        text: 'Late check-in?',
        fromMe: true,
        senderName: 'Diana M.',
        createdAt: '2026-11-27T10:00:00Z',
      },
    });
    await fixture.whenStable();

    expect(page.textContent).toContain('Late check-in?');
    expect(input.value).toBe('');
  });

  it('asks before cancelling and then shows the new status', async () => {
    const { fixture, page } = await render();
    const button = (text: string) =>
      [...page.querySelectorAll('button')].find((b) => b.textContent!.includes(text))!;

    button('account.cancel').click();
    await fixture.whenStable();
    backend.expectNone((r) => r.url.includes('/cancel'));

    button('account.cancelYes').click();
    backend
      .expectOne('/api/requests/TRZ-123456/cancel?lang=en')
      .flush({ data: { ...detail, status: 'CANCELLED', canCancel: false } });
    await fixture.whenStable();

    expect(page.textContent).toContain('status.CANCELLED');
    expect(page.querySelector('#message-text')).toBeNull();
  });

  it('offers the review form after the visit', async () => {
    const { fixture, page } = await render({
      ...detail,
      status: 'ARRIVED',
      canCancel: false,
      canReview: true,
    });
    expect(page.textContent).toContain('review.title');

    // Choose 4 stars and send
    page.querySelector<HTMLButtonElement>('button[aria-label="4 / 5"]')!.click();
    await fixture.whenStable();
    page.querySelector('app-review-form form')!.dispatchEvent(new Event('submit'));

    const req = backend.expectOne('/api/reviews');
    expect(req.request.body).toEqual({ requestCode: 'TRZ-123456', rating: 4 });
    req.flush({ data: {} }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(page.textContent).toContain('review.thanks');
  });
});
