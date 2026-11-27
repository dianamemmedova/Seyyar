import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  amenities,
  areas,
  faqItems,
  itineraries,
  places,
  regions,
  routes,
  type PlaceSeed,
} from './seed-data';

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!databaseUrl) throw new Error('DATABASE_URL yoxdur');
if (!adminEmail || !adminPassword) {
  throw new Error('.env faylına SEED_ADMIN_EMAIL və SEED_ADMIN_PASSWORD əlavə et');
}
if (adminPassword.length < 8) throw new Error('SEED_ADMIN_PASSWORD ən azı 8 simvol olmalıdır');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

async function seedRegionsAndAreas() {
  for (const region of regions) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: { name: region.name, isActive: region.isActive },
      create: region,
    });
  }

  const baku = await prisma.region.findUniqueOrThrow({ where: { slug: 'baku' } });

  for (const area of areas) {
    await prisma.area.upsert({
      where: { regionId_slug: { regionId: baku.id, slug: area.slug } },
      update: { name: area.name, lat: area.lat, lng: area.lng },
      create: { ...area, regionId: baku.id },
    });
  }

  return baku.id;
}

async function seedAmenities() {
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: { name: amenity.name, icon: amenity.icon },
      create: amenity,
    });
  }
}

async function seedPlace(place: PlaceSeed, regionId: number) {
  const area = await prisma.area.findUniqueOrThrow({
    where: { regionId_slug: { regionId, slug: place.area } },
  });

  const base = {
    type: place.type,
    status: 'PUBLISHED' as const,
    source: 'MANUAL' as const,
    name: place.name,
    description: place.description,
    address: place.address,
    areaId: area.id,
    lat: place.lat,
    lng: place.lng,
    phone: place.phone ?? null,
    categories: place.categories,
    isFeatured: place.isFeatured ?? false,
    featuredOrder: place.featuredOrder ?? null,
    publishedAt: now,
    stars: place.type === 'HOTEL' ? place.stars : null,
    priceFrom: place.type === 'ATTRACTION' ? null : place.priceFrom,
    priceLevel: place.type === 'RESTAURANT' ? place.priceLevel : null,
    checkInTime: place.type === 'HOTEL' ? place.checkInTime : null,
    checkOutTime: place.type === 'HOTEL' ? place.checkOutTime : null,
    recommendedMinutes: place.type === 'ATTRACTION' ? place.recommendedMinutes : null,
    officialTicketUrl: place.type === 'ATTRACTION' ? (place.officialTicketUrl ?? null) : null,
  };

  const saved = await prisma.place.upsert({
    where: { slug: place.slug },
    update: base,
    create: { slug: place.slug, ...base },
  });

  // Children are recreated on every run, so running the seed twice never duplicates them
  await prisma.$transaction([
    prisma.placePhoto.deleteMany({ where: { placeId: saved.id } }),
    prisma.placeAmenity.deleteMany({ where: { placeId: saved.id } }),
    prisma.openingHours.deleteMany({ where: { placeId: saved.id } }),
    prisma.offer.deleteMany({ where: { placeId: saved.id } }),
    prisma.room.deleteMany({ where: { placeId: saved.id } }),
    prisma.menuCategory.deleteMany({ where: { placeId: saved.id } }),
    prisma.ticketPrice.deleteMany({ where: { placeId: saved.id } }),
  ]);

  const amenityRows = await prisma.amenity.findMany({ where: { code: { in: place.amenities } } });

  await prisma.place.update({
    where: { id: saved.id },
    data: {
      photos: {
        create: place.photos.map((url, index) => ({ url, sortOrder: index, isCover: index === 0 })),
      },
      amenities: {
        create: amenityRows.map((amenity) => ({ amenityId: amenity.id })),
      },
      offers: place.offer
        ? {
            create: {
              title: place.offer.title,
              discountPercent: place.offer.discountPercent,
              startsAt: daysFromNow(-1),
              endsAt: daysFromNow(60),
            },
          }
        : undefined,
    },
  });

  if (place.type === 'HOTEL') {
    await prisma.room.createMany({
      data: place.rooms.map((room, index) => ({ ...room, placeId: saved.id, sortOrder: index })),
    });
  }

  if (place.type === 'RESTAURANT') {
    await prisma.openingHours.createMany({
      data: place.hours.map((hours) => ({ ...hours, placeId: saved.id })),
    });

    for (const [categoryIndex, category] of place.menu.entries()) {
      await prisma.menuCategory.create({
        data: {
          placeId: saved.id,
          name: category.name,
          sortOrder: categoryIndex,
          items: {
            create: category.items.map(([name, price, weightGrams, tags, isSet], itemIndex) => ({
              name,
              price,
              weightGrams,
              tags,
              isSet: isSet ?? false,
              sortOrder: itemIndex,
            })),
          },
        },
      });
    }
  }

  if (place.type === 'ATTRACTION') {
    await prisma.openingHours.createMany({
      data: place.hours.map((hours) => ({ ...hours, placeId: saved.id })),
    });
    await prisma.ticketPrice.createMany({
      data: place.tickets.map((ticket, index) => ({ ...ticket, placeId: saved.id, sortOrder: index })),
    });
  }
}

async function seedRoutes(regionId: number) {
  for (const { steps, tags, ...route } of routes) {
    const data = { ...route, tags, regionId };

    const saved = await prisma.transportRoute.upsert({
      where: { slug: route.slug },
      update: data,
      create: data,
    });

    await prisma.routeStep.deleteMany({ where: { routeId: saved.id } });
    await prisma.routeStep.createMany({
      data: steps.map((step, index) => ({ ...step, routeId: saved.id, sortOrder: index })),
    });
  }
}

async function seedItineraries() {
  for (const { stops, ...itinerary } of itineraries) {
    const saved = await prisma.itinerary.upsert({
      where: { slug: itinerary.slug },
      update: { ...itinerary, isPublished: true },
      create: { ...itinerary, isPublished: true },
    });

    await prisma.itineraryStop.deleteMany({ where: { itineraryId: saved.id } });

    for (const [index, stop] of stops.entries()) {
      const place = await prisma.place.findUniqueOrThrow({ where: { slug: stop.place } });
      await prisma.itineraryStop.create({
        data: {
          itineraryId: saved.id,
          placeId: place.id,
          day: stop.day,
          time: stop.time,
          sortOrder: index,
        },
      });
    }
  }
}

async function seedFaq() {
  await prisma.faqItem.deleteMany();
  await prisma.faqItem.createMany({
    data: faqItems.map((item, index) => ({ ...item, sortOrder: index })),
  });
}

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(adminPassword!, 10);
  const email = adminEmail!.trim().toLowerCase();

  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash },
    create: { email, passwordHash, fullName: 'Seyyar Admin', role: 'ADMIN' },
  });
}

async function main() {
  console.log('Seed başladı...');

  const bakuId = await seedRegionsAndAreas();
  await seedAmenities();

  for (const place of places) {
    await seedPlace(place, bakuId);
  }

  await seedRoutes(bakuId);
  await seedItineraries();
  await seedFaq();
  await seedAdmin();

  const counts = {
    regions: await prisma.region.count(),
    areas: await prisma.area.count(),
    hotels: await prisma.place.count({ where: { type: 'HOTEL' } }),
    restaurants: await prisma.place.count({ where: { type: 'RESTAURANT' } }),
    attractions: await prisma.place.count({ where: { type: 'ATTRACTION' } }),
    rooms: await prisma.room.count(),
    menuItems: await prisma.menuItem.count(),
    routes: await prisma.transportRoute.count(),
    itineraries: await prisma.itinerary.count(),
    faq: await prisma.faqItem.count(),
    admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
  };

  console.table(counts);
  console.log('Seed bitdi ✅');
}

main()
  .catch((error) => {
    console.error('Seed xətası:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
