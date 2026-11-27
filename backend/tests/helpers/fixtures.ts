import { prisma } from '../../src/lib/prisma';
import { addDays, bakuToday } from '../../src/lib/dates';

const t = (en: string, ru = `${en} (ru)`, az = `${en} (az)`) => ({ en, ru, az });

// Every day the same hours (0 = Monday ... 6 = Sunday)
const everyDay = (opensAt: string, closesAt: string, closedDays: number[] = []) =>
  Array.from({ length: 7 }, (_, dayOfWeek) =>
    closedDays.includes(dayOfWeek)
      ? { dayOfWeek, isClosed: true }
      : { dayOfWeek, opensAt, closesAt },
  );

/**
 * A small, fixed world for the API tests:
 * 2 regions, 2 areas, 2 amenities, 2 hotels, 2 restaurants, 1 museum, 1 draft hotel,
 * 4 transport routes, 1 itinerary and 4 FAQ items.
 * Values are chosen so that expected results are easy to calculate by hand.
 */
export async function createFixtures() {
  const baku = await prisma.region.create({
    data: { slug: 'baku', name: t('Baku'), isActive: true },
  });
  const gabala = await prisma.region.create({
    data: { slug: 'gabala', name: t('Gabala'), isActive: false },
  });

  const oldCity = await prisma.area.create({
    data: { regionId: baku.id, slug: 'old-city', name: t('Old City'), lat: 40.366, lng: 49.836 },
  });
  const seaside = await prisma.area.create({
    data: { regionId: baku.id, slug: 'seaside', name: t('Seaside'), lat: 40.364, lng: 49.845 },
  });

  const wifi = await prisma.amenity.create({
    data: { code: 'wifi', name: t('Wi-Fi'), icon: 'wifi' },
  });
  const parking = await prisma.amenity.create({
    data: { code: 'parking', name: t('Parking'), icon: 'local_parking' },
  });

  // ── Hotels ──────────────────────────────────
  const hotel = await prisma.place.create({
    data: {
      slug: 'test-hotel',
      type: 'HOTEL',
      status: 'PUBLISHED',
      name: t('Test Hotel', 'Тест Отель', 'Test Otel'),
      areaId: oldCity.id,
      lat: 40.366,
      lng: 49.836,
      email: 'hotel@seyyar.test',
      priceFrom: 100,
      stars: 4,
      categories: ['boutique'],
      isFeatured: true,
      photos: { create: { url: 'https://example.com/hotel.jpg', isCover: true } },
      amenities: { create: [{ amenityId: wifi.id }, { amenityId: parking.id }] },
      offers: {
        create: {
          title: t('Winter deal'),
          discountPercent: 15,
          startsAt: new Date(Date.now() - 86_400_000),
          endsAt: new Date(Date.now() + 30 * 86_400_000),
        },
      },
    },
  });

  const standardRoom = await prisma.room.create({
    data: { placeId: hotel.id, name: t('Standard'), maxGuests: 2, pricePerNight: 100 },
  });
  const familyRoom = await prisma.room.create({
    data: { placeId: hotel.id, name: t('Family'), maxGuests: 4, pricePerNight: 180, sortOrder: 1 },
  });
  const closedRoom = await prisma.room.create({
    data: {
      placeId: hotel.id,
      name: t('Closed'),
      maxGuests: 2,
      pricePerNight: 90,
      isAvailable: false,
    },
  });

  const seaHotel = await prisma.place.create({
    data: {
      slug: 'sea-hotel',
      type: 'HOTEL',
      status: 'PUBLISHED',
      source: 'PARTNER',
      name: t('Sea Hotel'),
      areaId: seaside.id,
      lat: 40.36,
      lng: 49.85,
      priceFrom: 250,
      stars: 5,
      categories: ['luxury'],
      ratingAvg: 4.8,
      ratingCount: 10,
      amenities: { create: [{ amenityId: wifi.id }] },
    },
  });
  const seaRoom = await prisma.room.create({
    data: { placeId: seaHotel.id, name: t('Sea view'), maxGuests: 2, pricePerNight: 250 },
  });

  // Not published: must never be visible
  await prisma.place.create({
    data: {
      slug: 'draft-hotel',
      type: 'HOTEL',
      status: 'DRAFT',
      name: t('Draft Hotel'),
      lat: 40.37,
      lng: 49.84,
    },
  });

  // ── Restaurants ─────────────────────────────
  // Closed on Mondays, 10:00 - 23:00 the other days
  const restaurant = await prisma.place.create({
    data: {
      slug: 'test-restaurant',
      type: 'RESTAURANT',
      status: 'PUBLISHED',
      name: t('Test Restaurant'),
      areaId: oldCity.id,
      lat: 40.367,
      lng: 49.837,
      priceLevel: 2,
      categories: ['azerbaijani'],
      openingHours: { create: everyDay('10:00', '23:00', [0]) },
    },
  });

  const mains = await prisma.menuCategory.create({
    data: { placeId: restaurant.id, name: t('Mains') },
  });
  const plov = await prisma.menuItem.create({
    data: { categoryId: mains.id, name: t('Plov'), price: 15 },
  });
  const tea = await prisma.menuItem.create({
    data: { categoryId: mains.id, name: t('Tea'), price: 3, sortOrder: 1 },
  });
  const soldOut = await prisma.menuItem.create({
    data: { categoryId: mains.id, name: t('Sold out'), price: 20, isAvailable: false },
  });

  // Open after midnight: 18:00 - 02:00 every day
  const lateBar = await prisma.place.create({
    data: {
      slug: 'late-bar',
      type: 'RESTAURANT',
      status: 'PUBLISHED',
      name: t('Late Bar'),
      areaId: seaside.id,
      lat: 40.362,
      lng: 49.848,
      priceLevel: 3,
      categories: ['bar'],
      openingHours: { create: everyDay('18:00', '02:00') },
    },
  });
  const otherKitchen = await prisma.menuCategory.create({
    data: { placeId: lateBar.id, name: t('Drinks') },
  });
  const lateBarDrink = await prisma.menuItem.create({
    data: { categoryId: otherKitchen.id, name: t('Lemonade'), price: 5 },
  });

  // ── Attraction ──────────────────────────────
  const museum = await prisma.place.create({
    data: {
      slug: 'test-museum',
      type: 'ATTRACTION',
      status: 'PUBLISHED',
      name: t('Test Museum'),
      areaId: oldCity.id,
      lat: 40.3665,
      lng: 49.8365,
      categories: ['museum'],
      openingHours: { create: everyDay('10:00', '18:00') },
      ticketPrices: { create: { label: t('Adult'), price: 10 } },
    },
  });

  // ── Transport ───────────────────────────────
  const AIRPORT = t('Airport');
  const CENTER = t('City center');
  const BUS_STATION = t('Bus station');

  await prisma.transportRoute.create({
    data: {
      slug: 'airport-center-taxi',
      regionId: baku.id,
      fromKey: 'airport',
      toKey: 'city-center',
      fromLabel: AIRPORT,
      toLabel: CENTER,
      mode: 'TAXI',
      priceMin: 25,
      priceMax: 35,
      priceUnit: 'PER_VEHICLE',
      durationMin: 30,
      tags: [t('24/7')],
      isPopular: true,
      steps: {
        create: {
          sortOrder: 0,
          mode: 'TAXI',
          instruction: t('Take a taxi'),
          durationMin: 30,
          price: 30,
        },
      },
    },
  });
  await prisma.transportRoute.create({
    data: {
      slug: 'airport-center-bus',
      regionId: baku.id,
      fromKey: 'airport',
      toKey: 'city-center',
      fromLabel: AIRPORT,
      toLabel: CENTER,
      mode: 'AIRPORT_EXPRESS',
      priceMin: 2,
      priceUnit: 'PER_PERSON',
      durationMin: 45,
      walkMeters: 200,
      tags: [t('Cheapest')],
      isPopular: true,
      steps: {
        create: [
          { sortOrder: 0, mode: 'WALK', instruction: t('Walk to the stop'), durationMin: 5 },
          {
            sortOrder: 1,
            mode: 'AIRPORT_EXPRESS',
            instruction: t('Take the bus'),
            durationMin: 40,
            price: 2,
          },
        ],
      },
    },
  });
  await prisma.transportRoute.create({
    data: {
      slug: 'center-bus-station-metro',
      regionId: baku.id,
      fromKey: 'city-center',
      toKey: 'bus-station',
      fromLabel: CENTER,
      toLabel: BUS_STATION,
      mode: 'METRO',
      priceMin: 0.5,
      priceUnit: 'PER_PERSON',
      durationMin: 20,
      transfers: 1,
      tags: [],
    },
  });
  // In an inactive region: must never be shown
  await prisma.transportRoute.create({
    data: {
      slug: 'gabala-route',
      regionId: gabala.id,
      fromKey: 'gabala-center',
      toKey: 'tufandag',
      fromLabel: t('Gabala center'),
      toLabel: t('Tufandag'),
      mode: 'TAXI',
      priceMin: 10,
      priceUnit: 'PER_VEHICLE',
      durationMin: 15,
    },
  });

  // ── Itinerary ───────────────────────────────
  await prisma.itinerary.create({
    data: {
      slug: 'test-day',
      title: t('Test day'),
      days: 2,
      isPublished: true,
      stops: {
        create: [
          { placeId: museum.id, day: 1, time: '10:00', sortOrder: 0 },
          { placeId: restaurant.id, day: 1, time: '13:00', sortOrder: 1 },
          { placeId: lateBar.id, day: 2, time: '19:00', sortOrder: 2 },
        ],
      },
    },
  });
  await prisma.itinerary.create({
    data: { slug: 'hidden-day', title: t('Hidden'), days: 1, isPublished: false },
  });

  // ── FAQ ─────────────────────────────────────
  await prisma.faqItem.createMany({
    data: [
      { category: 'money', question: t('Currency?'), answer: t('Manat'), sortOrder: 1 },
      { category: 'money', question: t('Cards?'), answer: t('Yes'), sortOrder: 0 },
      { category: 'sim', question: t('SIM card?'), answer: t('At the airport') },
      { category: 'sim', question: t('Old'), answer: t('Old'), isActive: false },
    ],
  });

  return {
    hotel,
    seaHotel,
    restaurant,
    lateBar,
    museum,
    rooms: { standard: standardRoom, family: familyRoom, closed: closedRoom, sea: seaRoom },
    menu: { plov, tea, soldOut, lateBarDrink },
  };
}

export type Fixtures = Awaited<ReturnType<typeof createFixtures>>;

// Dates relative to today in Baku, so tests never get old
export const daysFromToday = (days: number) => addDays(bakuToday(), days);

// Next date (at least 2 days ahead) that falls on the given weekday (0 = Monday)
export function nextWeekday(weekday: number): string {
  for (let days = 2; days < 10; days++) {
    const date = daysFromToday(days);
    const dayOfWeek = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
    if (dayOfWeek === weekday) return date;
  }
  throw new Error('unreachable');
}
