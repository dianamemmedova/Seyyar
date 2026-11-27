import { prisma } from '../lib/prisma';
import { localize, localizeOptional, type Lang } from '../lib/i18n';
import { NotFoundError } from '../lib/errors';
import { distanceKm } from '../lib/geo';
import { listInclude, toPlaceListItem } from './places.mapper';

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function listItineraries(lang: Lang) {
  const itineraries = await prisma.itinerary.findMany({
    where: { isPublished: true },
    include: {
      stops: {
        // Only stops whose place is still published
        where: { place: { status: 'PUBLISHED' } },
        orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }],
        include: { place: { select: { photos: { where: { isCover: true }, take: 1, select: { url: true } } } } },
      },
    },
    orderBy: { days: 'asc' },
  });

  return itineraries.map((itinerary) => ({
    slug: itinerary.slug,
    title: localize(itinerary.title, lang),
    description: localizeOptional(itinerary.description, lang),
    days: itinerary.days,
    stopCount: itinerary.stops.length,
    // No own cover: use the photo of the first stop
    coverPhoto: itinerary.coverPhoto ?? itinerary.stops[0]?.place.photos[0]?.url ?? null,
  }));
}

export async function getItinerary(slug: string, lang: Lang) {
  const itinerary = await prisma.itinerary.findFirst({
    where: { slug, isPublished: true },
    include: {
      stops: {
        where: { place: { status: 'PUBLISHED' } },
        orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }],
        include: { place: { include: listInclude() } },
      },
    },
  });

  if (!itinerary) {
    throw new NotFoundError('Itinerary');
  }

  // Group the stops by day: [{ day: 1, stops: [...] }, { day: 2, stops: [...] }]
  const days = Array.from({ length: itinerary.days }, (_, index) => {
    const day = index + 1;
    const stops = itinerary.stops.filter((stop) => stop.day === day);

    return {
      day,
      stops: stops.map((stop, position) => {
        const previous = stops[position - 1];
        return {
          time: stop.time,
          note: localizeOptional(stop.note, lang),
          // Distance from the previous stop of the same day (straight line)
          distanceFromPreviousKm: previous ? round1(distanceKm(previous.place, stop.place)) : null,
          place: toPlaceListItem(stop.place, lang),
        };
      }),
    };
  });

  return {
    slug: itinerary.slug,
    title: localize(itinerary.title, lang),
    description: localizeOptional(itinerary.description, lang),
    days: itinerary.days,
    coverPhoto: itinerary.coverPhoto ?? itinerary.stops[0]?.place.photos[0]?.url ?? null,
    itinerary: days,
    // All stops in order, for drawing the route on the map
    mapPoints: itinerary.stops.map((stop) => ({
      day: stop.day,
      slug: stop.place.slug,
      name: localize(stop.place.name, lang),
      lat: stop.place.lat,
      lng: stop.place.lng,
    })),
  };
}
