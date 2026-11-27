import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import type { FavoritesQuery } from '../schemas/favorites.schema';
import { listInclude, toPlaceListItem } from './places.mapper';

async function findPublishedPlaceId(slug: string): Promise<number> {
  const place = await prisma.place.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { id: true },
  });

  if (!place) {
    throw new NotFoundError('Place');
  }

  return place.id;
}

export async function listFavorites(userId: number, query: FavoritesQuery) {
  const where: Prisma.FavoriteWhereInput = {
    userId,
    place: { status: 'PUBLISHED', type: query.type },
  };

  const [total, rows] = await prisma.$transaction([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      include: { place: { include: listInclude() } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      ...toPlaceListItem(row.place, query.lang),
      favoritedAt: row.createdAt,
    })),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

// Only the slugs: the website uses them to fill the heart icons on every card
export async function listFavoriteSlugs(userId: number): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, place: { status: 'PUBLISHED' } },
    select: { place: { select: { slug: true } } },
  });

  return rows.map((row) => row.place.slug);
}

// Adding twice is not an error: the place simply stays in favorites
export async function addFavorite(userId: number, slug: string): Promise<void> {
  const placeId = await findPublishedPlaceId(slug);

  await prisma.favorite.upsert({
    where: { userId_placeId: { userId, placeId } },
    create: { userId, placeId },
    update: {},
  });
}

// Removing something that is not there is not an error either
export async function removeFavorite(userId: number, slug: string): Promise<void> {
  await prisma.favorite.deleteMany({
    where: { userId, place: { slug } },
  });
}
