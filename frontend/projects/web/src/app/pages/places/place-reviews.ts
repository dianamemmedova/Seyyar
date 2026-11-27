import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import {
  API_BASE_URL,
  type ApiResponse,
  type PlaceReview,
  type ReviewsMeta,
  type TravelType,
} from '@seyyar/shared';
import { LanguageService } from '../../core/language';

type ReviewsResponse = ApiResponse<PlaceReview[], ReviewsMeta>;

const STEP = 5;
const TRAVEL_TYPES: TravelType[] = ['family', 'couple', 'solo', 'friends'];

// "Guest reviews" block of a detail page: summary, who-travelled tabs, list, "Show more"
@Component({
  selector: 'app-place-reviews',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './place-reviews.html',
})
export class PlaceReviews {
  private readonly api = inject(API_BASE_URL);
  protected readonly lang = inject(LanguageService).current;
  protected readonly travelTypes = TRAVEL_TYPES;

  readonly slug = input.required<string>();

  protected readonly travelType = signal<TravelType | null>(null);
  // "Show more" asks for 5 more at once (the API allows up to 50)
  protected readonly limit = signal(STEP);

  protected readonly reviews = httpResource<ReviewsResponse>(() => ({
    url: `${this.api}/places/${this.slug()}/reviews`,
    params: {
      lang: this.lang(),
      limit: this.limit(),
      ...(this.travelType() ? { travelType: this.travelType()! } : {}),
    },
  }));

  // Keep the shown reviews while the next 5 load, so the list does not jump
  private readonly result = linkedSignal<ReviewsResponse | undefined, ReviewsResponse | null>({
    source: () => (this.reviews.hasValue() ? this.reviews.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? null,
  });
  protected readonly items = computed(() => this.result()?.data ?? []);
  protected readonly meta = computed(() => this.result()?.meta ?? null);
  protected readonly hasMore = computed(() => {
    const meta = this.meta();
    return meta !== null && this.items().length < meta.total && this.limit() < 50;
  });

  protected filter(type: TravelType | null): void {
    this.travelType.set(type);
    this.limit.set(STEP);
  }

  protected showMore(): void {
    this.limit.update((value) => Math.min(value + STEP, 50));
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
