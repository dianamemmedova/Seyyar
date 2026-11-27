import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import type { PlaceReview } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { PlaceReviews } from './place-reviews';

const review = (id: number): PlaceReview => ({
  id,
  author: `Guest ${id}`,
  rating: 5,
  categoryRatings: null,
  text: 'Great place',
  photos: [],
  travelType: 'family',
  partnerReply: id === 1 ? 'Thank you!' : null,
  partnerRepliedAt: null,
  createdAt: '2026-11-01T10:00:00Z',
});

const meta = (total: number, limit: number) => ({
  page: 1,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  ratingAvg: 4.8,
  ratingCount: total,
});

describe('PlaceReviews', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()],
    });
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(LanguageService).current.set('en');
  });

  const reviewsRequest = () => backend.expectOne((req) => req.url === '/api/places/sea/reviews');

  it('shows 5 reviews, then 5 more, and filters by kind of trip', async () => {
    const fixture = TestBed.createComponent(PlaceReviews);
    fixture.componentRef.setInput('slug', 'sea');
    TestBed.tick();
    const page = fixture.nativeElement as HTMLElement;

    reviewsRequest().flush({
      data: [1, 2, 3, 4, 5].map(review),
      meta: meta(7, 5),
    });
    await fixture.whenStable();
    expect(page.querySelectorAll('li')).toHaveLength(5);
    expect(page.textContent).toContain('4.8');
    expect(page.textContent).toContain('Thank you!');

    const button = (text: string) =>
      [...page.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;

    button('detail.moreReviews').click();
    TestBed.tick();
    const more = reviewsRequest();
    expect(more.request.params.get('limit')).toBe('10');
    more.flush({ data: [1, 2, 3, 4, 5, 6, 7].map(review), meta: meta(7, 10) });
    await fixture.whenStable();
    expect(page.querySelectorAll('li')).toHaveLength(7);
    // Everything is shown: no "Show more" any more
    expect(button('detail.moreReviews')).toBeUndefined();

    button('review.types.couple').click();
    TestBed.tick();
    const couples = reviewsRequest();
    expect(couples.request.params.get('travelType')).toBe('couple');
    expect(couples.request.params.get('limit')).toBe('5');
    couples.flush({ data: [], meta: { ...meta(0, 5), ratingCount: 7 } });
    await fixture.whenStable();
    expect(page.textContent).toContain('detail.noReviewsOfType');
  });
});
