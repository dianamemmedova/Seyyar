import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  API_BASE_URL,
  type ApiResponse,
  type PageMeta,
  type PlaceFilterOptions,
  type PlaceListItem,
  type PlaceType,
} from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import {
  countActive,
  FILTER_KEYS,
  type PlaceFilters,
  parseFilters,
  type Sort,
  SORTS,
  toApiParams,
  toUrlParams,
} from '../../core/place-filters';
import { placeLink } from '../../core/place-routes';
import { AznPipe } from '../../ui/azn.pipe';
import { PlaceCard } from '../../ui/place-card';
import { type MapPin, PlaceMap } from '../../ui/place-map';
import { FiltersPanel } from './filters-panel';

type ListResponse = ApiResponse<PlaceListItem[], PageMeta>;

const azn = new AznPipe();

// /en/hotels, /en/restaurants, /en/places — one page, the type comes from the route data
@Component({
  selector: 'app-place-list',
  imports: [RouterLink, TranslatePipe, PlaceCard, PlaceMap, FiltersPanel],
  templateUrl: './place-list.html',
})
export class PlaceList {
  private readonly api = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  protected readonly lang = inject(LanguageService).current;

  // From app.routes.ts: data: { type: 'HOTEL' }
  readonly type = input.required<PlaceType>();

  // All filters live in the URL, so a filtered list can be shared or bookmarked
  private readonly query = toSignal(this.route.queryParamMap, {
    requireSync: true,
  });
  protected readonly filters = computed(() => parseFilters(this.query()));
  protected readonly activeCount = computed(() => countActive(this.filters()));
  protected readonly sorts = SORTS;

  protected readonly places = httpResource<ListResponse>(() => ({
    url: `${this.api}/places`,
    params: toApiParams(this.filters(), this.type(), this.lang()),
  }));

  protected readonly options = httpResource<ApiResponse<PlaceFilterOptions>>(() => ({
    url: `${this.api}/places/filters`,
    params: { type: this.type(), lang: this.lang() },
  }));
  protected readonly filterOptions = computed(() =>
    this.options.hasValue() ? this.options.value().data : null,
  );

  // While new results load, the old cards stay on screen (dimmed) instead of jumping to skeletons
  protected readonly result = linkedSignal<ListResponse | undefined, ListResponse | null>({
    source: () => (this.places.hasValue() ? this.places.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? null,
  });
  protected readonly items = computed(() => this.result()?.data ?? []);
  protected readonly pageMeta = computed(() => this.result()?.meta ?? null);

  protected readonly pins = computed<MapPin[]>(() =>
    this.items().map((place) => ({
      id: place.id,
      lat: place.lat,
      lng: place.lng,
      label: this.pinLabel(place),
    })),
  );

  // Mobile: the filters open as a full-screen panel
  protected readonly filtersOpen = signal(false);

  constructor() {
    effect(() => {
      const key = `list.${this.type()}`;
      this.lang();
      this.title.setTitle(this.translate.instant(`${key}.metaTitle`));
      this.meta.updateTag({
        name: 'description',
        content: this.translate.instant(`${key}.subtitle`),
      });
    });
  }

  protected update(change: Partial<PlaceFilters>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toUrlParams(change),
      queryParamsHandling: 'merge',
    });
  }

  protected setSort(value: string): void {
    this.update({ sort: value as Sort });
  }

  protected clear(): void {
    const empty = Object.fromEntries(FILTER_KEYS.map((key) => [key, null]));
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...empty, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected openPin(id: number): void {
    const place = this.items().find((item) => item.id === id);
    if (place) this.router.navigate(placeLink(this.lang(), place.type, place.slug));
  }

  // "120 ₼" for hotels and tickets, "₼₼" for restaurants, the name for free places
  private pinLabel(place: PlaceListItem): string {
    if (place.type === 'RESTAURANT' && place.priceLevel) return '₼'.repeat(place.priceLevel);
    if (place.priceFrom) return azn.transform(place.priceFrom);
    return place.name;
  }
}
