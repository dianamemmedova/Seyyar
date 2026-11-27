import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { localize, type Lang } from '../lib/i18n';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../lib/errors';
import { isPrismaError, PrismaErrorCode } from '../lib/prisma-errors';
import { CATEGORY_KEYS, type CreateReviewInput, type MyReviewsQuery } from '../schemas/reviews.schema';

// Works with the normal client and inside a transaction
type Db = Prisma.TransactionClient;

// Recounts the average from the published reviews, so the number can never drift.
// The admin panel will call it too, after hiding or showing a review.
export async function recalculatePlaceRating(placeId: number, db: Db = prisma): Promise<void> {
  const result = await db.review.aggregate({
    where: { placeId, status: 'PUBLISHED' },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await db.place.update({
    where: { id: placeId },
    data: {
      ratingAvg: result._avg.rating ?? 0,
      ratingCount: result._count._all,
    },
  });
}

const reviewInclude = {
  place: {
    select: {
      slug: true,
      type: true,
      name: true,
      photos: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  },
  request: { select: { code: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithPlace = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

function toMyReview(review: ReviewWithPlace, lang: Lang) {
  return {
    id: review.id,
    requestCode: review.request.code,
    place: {
      slug: review.place.slug,
      type: review.place.type,
      name: localize(review.place.name, lang),
      coverPhoto: review.place.photos[0]?.url ?? null,
    },
    rating: review.rating,
    categoryRatings: review.categoryRatings,
    text: review.text,
    photos: review.photos,
    travelType: review.travelType,
    status: review.status,
    partnerReply: review.partnerReply,
    partnerRepliedAt: review.partnerRepliedAt,
    createdAt: review.createdAt,
  };
}

function checkCategoryKeys(placeType: string, categoryRatings: Record<string, number> | undefined) {
  if (!categoryRatings) return;

  const allowed: readonly string[] =
    placeType === 'HOTEL' ? CATEGORY_KEYS.HOTEL : CATEGORY_KEYS.RESTAURANT;
  const wrong = Object.keys(categoryRatings).filter((key) => !allowed.includes(key));

  if (wrong.length > 0) {
    throw new BadRequestError(
      `Unknown rating categories: ${wrong.join(', ')}. Allowed: ${allowed.join(', ')}`,
      'INVALID_CATEGORY_RATINGS',
    );
  }
}

export async function createReview(userId: number, input: CreateReviewInput, lang: Lang) {
  const request = await prisma.bookingRequest.findFirst({
    where: { code: input.requestCode, userId },
    select: {
      id: true,
      status: true,
      placeId: true,
      place: { select: { type: true } },
      review: { select: { id: true } },
    },
  });

  // Someone else's request looks the same as a missing one
  if (!request) {
    throw new NotFoundError('Request');
  }

  if (request.status !== 'ARRIVED') {
    throw new ForbiddenError('You can review a place only after your visit', 'REVIEW_NOT_ALLOWED');
  }

  if (request.review) {
    throw new ConflictError('You have already reviewed this visit', 'REVIEW_EXISTS');
  }

  checkCategoryKeys(request.place.type, input.categoryRatings);

  try {
    // The review and the new average are saved together
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId,
          placeId: request.placeId,
          requestId: request.id,
          rating: input.rating,
          categoryRatings: input.categoryRatings,
          text: input.text ?? null,
          travelType: input.travelType ?? null,
        },
        include: reviewInclude,
      });

      await recalculatePlaceRating(request.placeId, tx);

      return created;
    });

    return toMyReview(review, lang);
  } catch (error) {
    // Two clicks at the same moment: the unique requestId stops the second one
    if (isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION)) {
      throw new ConflictError('You have already reviewed this visit', 'REVIEW_EXISTS');
    }
    throw error;
  }
}

export async function listMyReviews(userId: number, query: MyReviewsQuery) {
  const where: Prisma.ReviewWhereInput = { userId };

  const [total, rows] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map((row) => toMyReview(row, query.lang)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
