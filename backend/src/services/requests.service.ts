import { randomInt } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import type { Lang } from '../lib/i18n';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors';
import { isPrismaError, PrismaErrorCode } from '../lib/prisma-errors';
import { addDays, bakuToday, nightsBetween, parseDateOnly, weekdayOf } from '../lib/dates';
import { bakuClock } from '../lib/opening-hours';
import { assertTransition, STATUS_GROUPS } from '../lib/request-status';
import { sendMailInBackground } from '../lib/mailer';
import {
  newRequestForPlace,
  requestCancelledForPlace,
  requestReceivedForTourist,
} from '../emails/templates';
import type {
  CreateRequestInput,
  HotelRequestInput,
  MyRequestsQuery,
  TableRequestInput,
} from '../schemas/requests.schema';
import {
  requestDetailInclude,
  requestListInclude,
  toMessage,
  toRequestDetail,
  toRequestListItem,
  toRequestSummary,
} from './requests.mapper';

const MAX_NIGHTS = 30;
const MAX_DAYS_AHEAD_HOTEL = 365;
const MAX_DAYS_AHEAD_TABLE = 90;

type PlaceForRequest = Prisma.PlaceGetPayload<{
  include: { openingHours: true; partner: { select: { contactEmail: true } } };
}>;

// Plain columns of a new request (code, type, user and place are added at create time)
type RequestFields = {
  dateFrom: Date;
  dateTo?: Date;
  time?: string;
  guests: number;
  children?: number;
  totalEstimate: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: boolean;
  note: string | null;
  specialRequests: string[];
};

type RequestDraft = {
  fields: RequestFields;
  items: Prisma.RequestItemCreateManyRequestInput[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;

function contactFields(input: CreateRequestInput) {
  return {
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    contactWhatsapp: input.contactWhatsapp,
    note: input.note ?? null,
    specialRequests: input.specialRequests,
  };
}

// ─────────────────────────────────────────────
// Hotel request: dates, rooms, capacity, total
// ─────────────────────────────────────────────

async function buildHotelDraft(
  place: PlaceForRequest,
  input: HotelRequestInput,
): Promise<RequestDraft> {
  if (place.type !== 'HOTEL') {
    throw new BadRequestError('This place does not accept hotel requests', 'WRONG_REQUEST_TYPE');
  }

  const today = bakuToday();

  if (input.dateFrom < today) {
    throw new BadRequestError('Check-in date cannot be in the past', 'DATE_IN_PAST');
  }
  if (input.dateFrom > addDays(today, MAX_DAYS_AHEAD_HOTEL)) {
    throw new BadRequestError('Check-in date is too far in the future', 'DATE_TOO_FAR');
  }
  if (input.dateTo <= input.dateFrom) {
    throw new BadRequestError('Check-out must be after check-in', 'INVALID_DATES');
  }

  const nights = nightsBetween(input.dateFrom, input.dateTo);
  if (nights > MAX_NIGHTS) {
    throw new BadRequestError(`A stay can be at most ${MAX_NIGHTS} nights`, 'STAY_TOO_LONG');
  }

  const rooms = await prisma.room.findMany({
    where: {
      id: { in: input.rooms.map((room) => room.roomId) },
      placeId: place.id,
      isAvailable: true,
    },
  });

  if (rooms.length !== input.rooms.length) {
    throw new BadRequestError('Some of the selected rooms are not available', 'ROOM_NOT_AVAILABLE');
  }

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const selected = input.rooms.map((choice) => ({
    room: roomById.get(choice.roomId)!,
    quantity: choice.quantity,
  }));

  const capacity = selected.reduce((sum, { room, quantity }) => sum + room.maxGuests * quantity, 0);
  if (capacity < input.guests + input.children) {
    throw new BadRequestError('The selected rooms do not fit all guests', 'NOT_ENOUGH_CAPACITY');
  }

  const perNight = selected.reduce(
    (sum, { room, quantity }) => sum + room.pricePerNight.toNumber() * quantity,
    0,
  );

  return {
    fields: {
      dateFrom: parseDateOnly(input.dateFrom),
      dateTo: parseDateOnly(input.dateTo),
      guests: input.guests,
      children: input.children,
      totalEstimate: round2(perNight * nights),
      ...contactFields(input),
    },
    items: selected.map(({ room, quantity }) => ({
      roomId: room.id,
      quantity,
      unitPrice: room.pricePerNight,
    })),
  };
}

// ─────────────────────────────────────────────
// Table request: date, time, opening hours, pre-order
// ─────────────────────────────────────────────

function isWithinOpeningHours(place: PlaceForRequest, date: string, time: string): boolean {
  // No opening hours entered: we cannot check, so we accept
  if (place.openingHours.length === 0) return true;

  const day = place.openingHours.find((row) => row.dayOfWeek === weekdayOf(date));
  if (!day || day.isClosed || !day.opensAt || !day.closesAt) return false;

  // Normal day (11:00 - 23:00)
  if (day.closesAt > day.opensAt) {
    return time >= day.opensAt && time < day.closesAt;
  }

  // Closes after midnight (18:00 - 01:00)
  return time >= day.opensAt || time < day.closesAt;
}

async function buildTableDraft(
  place: PlaceForRequest,
  input: TableRequestInput,
): Promise<RequestDraft> {
  if (place.type !== 'RESTAURANT') {
    throw new BadRequestError('This place does not accept table requests', 'WRONG_REQUEST_TYPE');
  }

  const today = bakuToday();

  if (input.date < today || (input.date === today && input.time <= bakuClock().time)) {
    throw new BadRequestError('The selected time is in the past', 'DATE_IN_PAST');
  }
  if (input.date > addDays(today, MAX_DAYS_AHEAD_TABLE)) {
    throw new BadRequestError('The selected date is too far in the future', 'DATE_TOO_FAR');
  }
  if (!isWithinOpeningHours(place, input.date, input.time)) {
    throw new BadRequestError(
      'The restaurant is closed at the selected time',
      'OUTSIDE_OPENING_HOURS',
    );
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: input.items.map((item) => item.menuItemId) },
      isAvailable: true,
      category: { placeId: place.id },
    },
  });

  if (menuItems.length !== new Set(input.items.map((item) => item.menuItemId)).size) {
    throw new BadRequestError(
      'Some of the selected dishes are not available',
      'MENU_ITEM_NOT_AVAILABLE',
    );
  }

  const itemById = new Map(menuItems.map((item) => [item.id, item]));
  const total = input.items.reduce(
    (sum, item) => sum + itemById.get(item.menuItemId)!.price.toNumber() * item.quantity,
    0,
  );

  return {
    fields: {
      dateFrom: parseDateOnly(input.date),
      time: input.time,
      guests: input.guests,
      // Without a pre-order there is no estimate
      totalEstimate: input.items.length > 0 ? round2(total) : null,
      ...contactFields(input),
    },
    items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: itemById.get(item.menuItemId)!.price,
      note: item.note ?? null,
    })),
  };
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

const generateRequestCode = () => `TRZ-${randomInt(100000, 1000000)}`;

// Codes are random; in the rare case of a duplicate we simply try another one
async function withUniqueCode<T>(create: (code: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await create(generateRequestCode());
    } catch (error) {
      if (!isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION)) throw error;
    }
  }
  throw new Error('Could not generate a unique request code');
}

function placeEmail(place: { email: string | null; partner: { contactEmail: string } | null }) {
  return place.email ?? place.partner?.contactEmail ?? config.ADMIN_NOTIFY_EMAIL ?? null;
}

export async function createRequest(userId: number, input: CreateRequestInput, lang: Lang) {
  const place = await prisma.place.findFirst({
    where: { slug: input.placeSlug, status: 'PUBLISHED' },
    include: { openingHours: true, partner: { select: { contactEmail: true } } },
  });

  if (!place) {
    throw new NotFoundError('Place');
  }

  const draft =
    input.type === 'HOTEL'
      ? await buildHotelDraft(place, input)
      : await buildTableDraft(place, input);

  const request = await withUniqueCode((code) =>
    prisma.bookingRequest.create({
      data: {
        ...draft.fields,
        code,
        type: input.type,
        user: { connect: { id: userId } },
        place: { connect: { id: place.id } },
        // createMany keeps the items in the order the tourist chose them
        items: { createMany: { data: draft.items } },
      },
      include: requestDetailInclude,
    }),
  );

  // Emails go out in the background; the tourist gets the answer immediately
  const summary = toRequestSummary(request);
  const recipient = placeEmail(place);
  if (recipient) {
    sendMailInBackground(newRequestForPlace(recipient, summary));
  }
  sendMailInBackground(requestReceivedForTourist(summary));

  return toRequestDetail(request, userId, lang);
}

// ─────────────────────────────────────────────
// My requests
// ─────────────────────────────────────────────

export async function listMyRequests(userId: number, query: MyRequestsQuery) {
  const where: Prisma.BookingRequestWhereInput = {
    userId,
    type: query.type,
    status: query.status ? { in: STATUS_GROUPS[query.status] } : undefined,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.bookingRequest.count({ where }),
    prisma.bookingRequest.findMany({
      where,
      include: requestListInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map((row) => toRequestListItem(row, query.lang)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

// Only the owner can see a request; for anyone else it simply does not exist (404)
async function findOwnRequest(userId: number, code: string) {
  const request = await prisma.bookingRequest.findFirst({
    where: { code, userId },
    include: requestDetailInclude,
  });

  if (!request) {
    throw new NotFoundError('Request');
  }

  return request;
}

export async function getMyRequest(userId: number, code: string, lang: Lang) {
  return toRequestDetail(await findOwnRequest(userId, code), userId, lang);
}

export async function cancelMyRequest(userId: number, code: string, lang: Lang) {
  const request = await findOwnRequest(userId, code);

  assertTransition(request.status, 'CANCELLED');

  const updated = await prisma.bookingRequest.update({
    where: { id: request.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: requestDetailInclude,
  });

  const place = await prisma.place.findUniqueOrThrow({
    where: { id: request.placeId },
    select: { email: true, partner: { select: { contactEmail: true } } },
  });
  const recipient = placeEmail(place);
  if (recipient) {
    sendMailInBackground(requestCancelledForPlace(recipient, toRequestSummary(updated)));
  }

  return toRequestDetail(updated, userId, lang);
}

export async function addMessage(userId: number, code: string, text: string) {
  const request = await prisma.bookingRequest.findFirst({
    where: { code, userId },
    select: { id: true, status: true },
  });

  if (!request) {
    throw new NotFoundError('Request');
  }

  if (request.status === 'CANCELLED' || request.status === 'EXPIRED') {
    throw new ConflictError('Messages cannot be sent to a closed request', 'REQUEST_CLOSED');
  }

  const message = await prisma.requestMessage.create({
    data: { requestId: request.id, senderId: userId, text },
    include: { sender: { select: { id: true, fullName: true } } },
  });

  return toMessage(message, userId);
}
