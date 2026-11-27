import { Component, computed, effect, inject, input } from '@angular/core';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  API_BASE_URL,
  type ApiResponse,
  type PlaceDetail as Detail,
  type PlaceListItem,
  type PlaceType,
} from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { PLACE_SECTION, placeLink } from '../../core/place-routes';
import { AznPipe } from '../../ui/azn.pipe';
import { FavoriteButton } from '../../ui/favorite-button';
import { PlaceCard } from '../../ui/place-card';
import { type MapPin, PlaceMap } from '../../ui/place-map';
import { NotFound } from '../not-found/not-found';
import { MenuList } from './menu-list';
import { OpeningHours } from './opening-hours';
import { PhotoGallery } from './photo-gallery';
import { PlaceReviews } from './place-reviews';
import { RoomsList } from './rooms-list';

// /en/hotels/:slug, /en/restaurants/:slug, /en/places/:slug
@Component({
  selector: 'app-place-detail',
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    AznPipe,
    FavoriteButton,
    PlaceCard,
    PlaceMap,
    NotFound,
    MenuList,
    OpeningHours,
    PhotoGallery,
    PlaceReviews,
    RoomsList,
  ],
  templateUrl: './place-detail.html',
})
export class PlaceDetail {
  private readonly api = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  protected readonly lang = inject(LanguageService).current;

  // type from the route data, slug from the URL
  readonly type = input.required<PlaceType>();
  readonly slug = input.required<string>();

  protected readonly place = httpResource<ApiResponse<Detail>>(
    () => `${this.api}/places/${this.slug()}?lang=${this.lang()}`,
  );
  protected readonly data = computed(() =>
    this.place.hasValue() ? this.place.value().data : null,
  );
  protected readonly notFound = computed(() => {
    const error = this.place.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  // Three places of the same kind close to this one
  protected readonly nearby = httpResource<ApiResponse<PlaceListItem[]>>(() => ({
    url: `${this.api}/places/${this.slug()}/nearby`,
    params: { lang: this.lang(), type: this.type(), limit: 3 },
  }));
  protected readonly nearbyPlaces = computed(() =>
    this.nearby.hasValue() ? this.nearby.value().data : [],
  );

  protected readonly section = computed(() => PLACE_SECTION[this.type()]);
  protected readonly pins = computed<MapPin[]>(() => {
    const place = this.data();
    return place ? [{ id: place.id, lat: place.lat, lng: place.lng, label: place.name }] : [];
  });

  protected readonly whatsappLink = computed(() => {
    const number = this.data()?.contact.whatsapp?.replace(/\D/g, '');
    return number ? `https://wa.me/${number}` : null;
  });
  protected readonly osmLink = computed(() => {
    const place = this.data();
    return place
      ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`
      : null;
  });

  // 90 -> 1.5 (hours, rounded to half an hour)
  protected readonly visitHours = computed(() => {
    const minutes = this.data()?.recommendedMinutes;
    return minutes ? Math.max(0.5, Math.round(minutes / 30) / 2) : null;
  });

  protected readonly starsText = computed(() => '★'.repeat(this.data()?.stars ?? 0));
  protected readonly priceLevelText = computed(() => '₼'.repeat(this.data()?.priceLevel ?? 0));

  constructor() {
    // Tab title + Google description of this place
    effect(() => {
      const place = this.data();
      if (!place) return;
      this.title.setTitle(`${place.name} — Seyyar`);
      if (place.description) {
        this.meta.updateTag({
          name: 'description',
          content: place.description,
        });
      }
    });

    // /hotels/<restaurant-slug> -> the right section, so every place has one address
    effect(() => {
      const place = this.data();
      if (place && place.type !== this.type()) {
        this.router.navigate(placeLink(this.lang(), place.type, place.slug), {
          replaceUrl: true,
        });
      }
    });
  }
}
