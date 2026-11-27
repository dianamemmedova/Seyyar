import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { localize, type Lang } from '../lib/i18n';
import { NotFoundError } from '../lib/errors';
import type {
  FiltersQuery,
  ListPlacesQuery,
  MapQuery,
  NearbyQuery,
  ReviewsQuery,
} from '../schemas/places.schema';
import {
  detailInclude,
  listInclude,
  shortName,
  toNumber,
  toPlaceDetail,
  toPlaceListItem,
} from './places.mapper';

const PUBLISHED = { status: 'PUBLISHED' } as const;

type PlaceType = 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

const pageMeta = (page: number, limit: number, total: number): PageMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// ─────────────────────────────────────────────
// List with filters
// ─────────────────────────────────────────────

// Full-text-like search over the name in all three languages
async function searchPlaceIds(q: string): Promise<number[]> {
  const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM places
    WHERE name->>'en' ILIKE ${pattern}
       OR name->>'ru' ILIKE ${pattern}
       OR name->>'az' ILIKE ${pattern}
  `;

  return rows.map((row) => row.id);
}

async function buildWhere(query: ListPlacesQuery): Promise<Prisma.PlaceWhereInput> {
  const now = new Date();
  const and: Prisma.PlaceWhereInput[] = [];

  if (query.q) {
    and.push({ id: { in: await searchPlaceIds(query.q) } });
  }

  // Every selected amenity must be present (Wi-Fi AND parking)
  for (const code of query.amenities ?? []) {
    and.push({ amenities: { some: { amenity: { code } } } });
  }

  return {
    ...PUBLISHED,
    type: query.type,
    area: query.area ? { slug: { in: query.area } } : undefined,
    categories: query.categories ? { hasSome: query.categories } : undefined,
    stars: query.stars ? { in: query.stars } : undefined,
    priceLevel: query.priceLevel ? { in: query.priceLevel } : undefined,
    priceFrom:
      query.priceMin !== undefined || query.priceMax !== undefined
        ? { gte: query.priceMin, lte: query.priceMax }
        : undefined,
    offers: query.hasDiscount
      ? { some: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } }
      : undefined,
    source: query.verifiedOnly ? 'PARTNER' : undefined,
    AND: and,
  };
}

function buildOrderBy(sort: ListPlacesQuery['sort']): Prisma.PlaceOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ priceFrom: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }];
    case 'price_desc':
      return [{ priceFrom: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }];
    case 'rating':
      return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }, { id: 'asc' }];
    default:
      return [
        { isFeatured: 'desc' },
        { featuredOrder: { sort: 'asc', nulls: 'last' } },
        { ratingAvg: 'desc' },
        { id: 'asc' },
      ];
  }
}

export async function listPlaces(query: ListPlacesQuery) {
  const where = await buildWhere(query);
  const origin =
    query.lat !== undefined && query.lng !== undefined
      ? { lat: query.lat, lng: query.lng }
      : undefined;

  // "Open now" and "nearest" are calculated in code, so these need all rows first.
  // Everything else is filtered, sorted and paginated by the database.
  const needsInMemory = query.openNow === true || query.sort === 'nearest';

  if (!needsInMemory) {
    const [total, rows] = await prisma.$transaction([
      prisma.place.count({ where }),
      prisma.place.findMany({
        where,
        include: listInclude(),
        orderBy: buildOrderBy(query.sort),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      items: rows.map((row) => toPlaceListItem(row, query.lang, origin)),
      meta: pageMeta(query.page, query.limit, total),
    };
  }

  const rows = await prisma.place.findMany({
    where,
    include: listInclude(),
    orderBy: buildOrderBy('recommended'),
  });

  let items = rows.map((row) => toPlaceListItem(row, query.lang, origin));

  if (query.openNow) {
    items = items.filter((item) => item.isOpenNow !== false);
  }

  if (query.sort === 'nearest') {
    items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  const start = (query.page - 1) * query.limit;

  return {
    items: items.slice(start, start + query.limit),
    meta: pageMeta(query.page, query.limit, items.length),
  };
}

// ─────────────────────────────────────────────
// Map pins
// ─────────────────────────────────────────────

export async function getMapPoints(query: MapQuery) {
  const [minLng, minLat, maxLng, maxLat] = query.bbox ?? [];

  const rows = await prisma.place.findMany({
    where: {
      ...PUBLISHED,
      type: query.type,
      lat: query.bbox ? { gte: minLat, lte: maxLat } : undefined,
      lng: query.bbox ? { gte: minLng, lte: maxLng } : undefined,
    },
    select: { id: true, slug: true, type: true, name: true, lat: true, lng: true, priceFrom: true },
    take: 500,
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    type: row.type,
    name: localize(row.name, query.lang),
    lat: row.lat,
    lng: row.lng,
    priceFrom: toNumber(row.priceFrom),
  }));
}

// ─────────────────────────────────────────────
// Detail, reviews, nearby
// ─────────────────────────────────────────────

export async function getPlaceBySlug(slug: string, lang: Lang) {
  const place = await prisma.place.findFirst({
    where: { ...PUBLISHED, slug },
    include: detailInclude(),
  });

  if (!place) {
    throw new NotFoundError('Place');
  }

  return toPlaceDetail(place, lang);
}

export async function getPlaceReviews(slug: string, query: ReviewsQuery) {
  const place = await prisma.place.findFirst({
    where: { ...PUBLISHED, slug },
    select: { id: true, ratingAvg: true, ratingCount: true },
  });

  if (!place) {
    throw new NotFoundError('Place');
  }

  const where: Prisma.ReviewWhereInput = {
    placeId: place.id,
    status: 'PUBLISHED',
    travelType: query.travelType,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map((review) => ({
      id: review.id,
      author: shortName(review.user.fullName),
      rating: review.rating,
      categoryRatings: review.categoryRatings,
      text: review.text,
      photos: review.photos,
      travelType: review.travelType,
      partnerReply: review.partnerReply,
      partnerRepliedAt: review.partnerRepliedAt,
      createdAt: review.createdAt,
    })),
    meta: {
      ...pageMeta(query.page, query.limit, total),
      ratingAvg: Math.round(place.ratingAvg * 10) / 10,
      ratingCount: place.ratingCount,
    },
  };
}

export async function getNearbyPlaces(slug: string, query: NearbyQuery) {
  const origin = await prisma.place.findFirst({
    where: { ...PUBLISHED, slug },
    select: { id: true, lat: true, lng: true },
  });

  if (!origin) {
    throw new NotFoundError('Place');
  }

  const rows = await prisma.place.findMany({
    where: { ...PUBLISHED, type: query.type, id: { not: origin.id } },
    include: listInclude(),
  });

  return rows
    .map((row) => toPlaceListItem(row, query.lang, origin))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, query.limit);
}

// ─────────────────────────────────────────────
// Filter options for the sidebar
// ─────────────────────────────────────────────

export async function getFilterOptions(query: FiltersQuery) {
  const placeWhere = { ...PUBLISHED, type: query.type };

  const [areas, amenities, places, price] = await Promise.all([
    prisma.area.findMany({
      where: { places: { some: placeWhere } },
      orderBy: { slug: 'asc' },
    }),
    prisma.amenity.findMany({
      where: { places: { some: { place: placeWhere } } },
      include: { _count: { select: { places: { where: { place: placeWhere } } } } },
      orderBy: { code: 'asc' },
    }),
    prisma.place.findMany({
      where: placeWhere,
      select: { categories: true, stars: true, priceLevel: true },
    }),
    prisma.place.aggregate({
      where: placeWhere,
      _min: { priceFrom: true },
      _max: { priceFrom: true },
    }),
  ]);

  // Count how many places have each category
  const categoryCounts = new Map<string, number>();
  for (const place of places) {
    for (const category of place.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  const unique = (values: (number | null)[]) =>
    [...new Set(values.filter((value): value is number => value !== null))].sort((a, b) => a - b);

  return {
    type: query.type,
    areas: areas.map((area) => ({ slug: area.slug, name: localize(area.name, query.lang) })),
    amenities: amenities.map((amenity) => ({
      code: amenity.code,
      name: localize(amenity.name, query.lang),
      icon: amenity.icon,
      count: amenity._count.places,
    })),
    categories: [...categoryCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    price: {
      min: toNumber(price._min.priceFrom),
      max: toNumber(price._max.priceFrom),
    },
    stars: unique(places.map((place) => place.stars)),
    priceLevels: unique(places.map((place) => place.priceLevel)),
  };
}

// ─────────────────────────────────────────────
// Home page blocks
// ─────────────────────────────────────────────

export async function getHome(lang: Lang) {
  const now = new Date();

  const featured = (type: PlaceType) =>
    prisma.place.findMany({
      where: { ...PUBLISHED, type },
      include: listInclude(),
      orderBy: buildOrderBy('recommended'),
      take: 8,
    });

  const [hotels, restaurants, attractions, withOffers, comingSoon] = await Promise.all([
    featured('HOTEL'),
    featured('RESTAURANT'),
    featured('ATTRACTION'),
    prisma.place.findMany({
      where: {
        ...PUBLISHED,
        offers: { some: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } },
      },
      include: listInclude(),
      orderBy: { ratingAvg: 'desc' },
      take: 8,
    }),
    prisma.region.findMany({ where: { isActive: false }, orderBy: { slug: 'asc' } }),
  ]);

  const toItems = (rows: typeof hotels) => rows.map((row) => toPlaceListItem(row, lang));

  return {
    recommendedHotels: toItems(hotels),
    whereToEat: toItems(restaurants),
    popularPlaces: toItems(attractions),
    offers: toItems(withOffers),
    comingSoonRegions: comingSoon.map((region) => ({
      slug: region.slug,
      name: localize(region.name, lang),
    })),
  };
}
