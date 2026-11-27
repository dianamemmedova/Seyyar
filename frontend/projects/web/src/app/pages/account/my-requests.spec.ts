import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/language';
import { MyRequests } from './my-requests';

const item = {
  code: 'TRZ-123456',
  type: 'HOTEL',
  status: 'NEW',
  place: {
    slug: 'h',
    type: 'HOTEL',
    name: 'Sea Hotel',
    coverPhoto: null,
    address: null,
    phone: null,
    whatsapp: null,
    lat: 0,
    lng: 0,
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
};

describe('MyRequests page', () => {
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

  function render(query: Record<string, string | undefined> = {}) {
    const fixture = TestBed.createComponent(MyRequests);
    // The router sets missing query values to undefined
    fixture.componentRef.setInput('status', query['status']);
    fixture.componentRef.setInput('page', query['page']);
    TestBed.tick();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('asks for the active tab and page 1 when the URL has no query', () => {
    render();
    const req = backend.expectOne((r) => r.url === '/api/requests/my');
    expect(req.request.params.get('status')).toBe('active');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  });

  it('ignores an unknown tab name', () => {
    render({ status: 'hacked', page: 'abc' });
    const req = backend.expectOne((r) => r.url === '/api/requests/my');
    expect(req.request.params.get('status')).toBe('active');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  });

  it('lists the requests with a link to each one', async () => {
    const { fixture, page } = render({ status: 'past', page: '2' });
    const req = backend.expectOne((r) => r.url === '/api/requests/my');
    expect(req.request.params.get('status')).toBe('past');
    req.flush({ data: [item], meta: { page: 2, limit: 10, total: 11, totalPages: 2 } });
    await fixture.whenStable();

    expect(page.textContent).toContain('Sea Hotel');
    expect(page.textContent).toContain('360 ₼');
    expect(page.querySelector('a[href="/en/account/requests/TRZ-123456"]')).not.toBeNull();
  });
});
