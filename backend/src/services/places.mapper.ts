import type { Prisma } from '../generated/prisma/client';
import { localize, localizeOptional, type Lang } from '../lib/i18n';
import { distanceKm } from '../lib/geo';
import { isOpenAt, todayHours } from '../lib/opening-hours';

// ─────────────────────────────────────────────
// What we load from the database
// ─────────────────────────────────────────────

const activeOfferWhere = (): Prisma.OfferWhereInput => {
  const now = new Date();
  return { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } };
};

// For cards in lists, on the map preview and on the home page
export const listInclude = () =>
  ({
    area: { select: { slug: true, name: true } },
    photos: { where: { isCover: true }, take: 1, select: { url: true } },
    amenities: { select: { amenity: { select: { code: true } } } },
    openingHours: true,
    offers: { where: activeOfferWhere(), orderBy: { discountPercent: 'desc' }, take: 1 },
  }) satisfies Prisma.PlaceInclude;

// For the detail page: everything about one place
export const detailInclude = () =>
  ({
    area: { select: { slug: true, name: true } },
    photos: { orderBy: { sortOrder: 'asc' } },
    amenities: { select: { amenity: true } },
    openingHours: { orderBy: { dayOfWeek: 'asc' } },
    rooms: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
    menuCategories: {
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    },
    ticketPrices: { orderBy: { sortOrder: 'asc' } },
    offers: { where: activeOfferWhere(), orderBy: { discountPercent: 'desc' } },
  }) satisfies Prisma.PlaceInclude;

export type PlaceForList = Prisma.PlaceGetPayload<{ include: ReturnType<typeof listInclude> }>;
export type PlaceForDetail = Prisma.PlaceGetPayload<{ include: ReturnType<typeof detailInclude> }>;

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────

export const toNumber = (value: Prisma.Decimal | null): number | null =>
  value === null ? null : value.toNumber();

const round1 = (value: number) => Math.round(value * 10) / 10;

// "Diana Mammadova" -> "Diana M."
export function shortName(fullName: string): string {
  const [first = '', last = ''] = fullName.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

type Origin = { lat: number; lng: number } | undefined;

// ─────────────────────────────────────────────
// Mappers: database row -> API response
// ─────────────────────────────────────────────

export function toPlaceListItem(place: PlaceForList, lang: Lang, origin?: Origin) {
  const offer = place.offers[0];

  return {
    id: place.id,
    slug: place.slug,
    type: place.type,
    name: localize(place.name, lang),
    area: place.area ? { slug: place.area.slug, name: localize(place.area.name, lang) } : null,
    lat: place.lat,
    lng: place.lng,
    coverPhoto: place.photos[0]?.url ?? null,
    priceFrom: toNumber(place.priceFrom),
    priceLevel: place.priceLevel,
    stars: place.stars,
    categories: place.categories,
    ratingAvg: round1(place.ratingAvg),
    ratingCount: place.ratingCount,
    isFeatured: place.isFeatured,
    isVerified: place.source === 'PARTNER',
    amenities: place.amenities.map((row) => row.amenity.code),
    offer: offer
      ? { title: localize(offer.title, lang), discountPercent: offer.discountPercent }
      : null,
    isOpenNow: place.type === 'HOTEL' ? null : isOpenAt(place.openingHours),
    distanceKm: origin ? round1(distanceKm(origin, place)) : null,
  };
}

export type PlaceListItem = ReturnType<typeof toPlaceListItem>;

export function toPlaceDetail(place: PlaceForDetail, lang: Lang) {
  const today = todayHours(place.openingHours);

  return {
    id: place.id,
    slug: place.slug,
    type: place.type,
    name: localize(place.name, lang),
    description: localizeOptional(place.description, lang),
    area: place.area ? { slug: place.area.slug, name: localize(place.area.name, lang) } : null,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    contact: {
      phone: place.phone,
      whatsapp: place.whatsapp,
      email: place.email,
      website: place.website,
    },
    priceFrom: toNumber(place.priceFrom),
    priceLevel: place.priceLevel,
    stars: place.stars,
    categories: place.categories,
    ratingAvg: round1(place.ratingAvg),
    ratingCount: place.ratingCount,
    isVerified: place.source === 'PARTNER',
    bookingUrl: place.bookingUrl,
    officialTicketUrl: place.officialTicketUrl,
    checkInTime: place.checkInTime,
    checkOutTime: place.checkOutTime,
    recommendedMinutes: place.recommendedMinutes,
    photos: place.photos.map((photo) => ({ url: photo.url, alt: photo.alt, isCover: photo.isCover })),
    amenities: place.amenities.map(({ amenity }) => ({
      code: amenity.code,
      name: localize(amenity.name, lang),
      icon: amenity.icon,
    })),
    openingHours: place.openingHours.map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({
      dayOfWeek,
      opensAt,
      closesAt,
      isClosed,
    })),
    isOpenNow: place.type === 'HOTEL' ? null : isOpenAt(place.openingHours),
    today: today
      ? { opensAt: today.opensAt, closesAt: today.closesAt, isClosed: today.isClosed }
      : null,
    rooms: place.rooms.map((room) => ({
      id: room.id,
      name: localize(room.name, lang),
      description: localizeOptional(room.description, lang),
      sizeM2: room.sizeM2,
      bedType: room.bedType,
      maxGuests: room.maxGuests,
      pricePerNight: room.pricePerNight.toNumber(),
      freeCancellation: room.freeCancellation,
      breakfastIncluded: room.breakfastIncluded,
      photos: room.photos,
    })),
    menu: place.menuCategories.map((category) => ({
      id: category.id,
      name: localize(category.name, lang),
      items: category.items.map((item) => ({
        id: item.id,
        name: localize(item.name, lang),
        description: localizeOptional(item.description, lang),
        price: item.price.toNumber(),
        weightGrams: item.weightGrams,
        photo: item.photo,
        tags: item.tags,
        isSet: item.isSet,
        isAvailable: item.isAvailable,
      })),
    })),
    tickets: place.ticketPrices.map((ticket) => {
      const price = ticket.price.toNumber();
      return { label: localize(ticket.label, lang), price, isFree: price === 0 };
    }),
    offers: place.offers.map((offer) => ({
      title: localize(offer.title, lang),
      description: localizeOptional(offer.description, lang),
      discountPercent: offer.discountPercent,
      endsAt: offer.endsAt,
    })),
  };
}
