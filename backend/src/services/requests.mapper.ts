import type { Prisma } from '../generated/prisma/client';
import { localize, type Lang } from '../lib/i18n';
import { formatDateOnly, nightsBetween } from '../lib/dates';
import { canTransition } from '../lib/request-status';
import type { RequestSummary } from '../emails/templates';
import { shortName } from './places.mapper';

const placeSummarySelect = {
  slug: true,
  type: true,
  name: true,
  address: true,
  phone: true,
  whatsapp: true,
  lat: true,
  lng: true,
  photos: { where: { isCover: true }, take: 1, select: { url: true } },
} satisfies Prisma.PlaceSelect;

export const requestListInclude = {
  place: { select: placeSummarySelect },
} satisfies Prisma.BookingRequestInclude;

export const requestDetailInclude = {
  place: { select: placeSummarySelect },
  items: {
    orderBy: { id: 'asc' },
    include: {
      room: { select: { name: true } },
      menuItem: { select: { name: true } },
    },
  },
  messages: {
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, fullName: true } } },
  },
  review: { select: { id: true } },
} satisfies Prisma.BookingRequestInclude;

type RequestForList = Prisma.BookingRequestGetPayload<{ include: typeof requestListInclude }>;
type RequestForDetail = Prisma.BookingRequestGetPayload<{ include: typeof requestDetailInclude }>;

const money = (value: Prisma.Decimal | null) => (value === null ? null : value.toNumber());

function placeSummary(place: RequestForList['place'], lang: Lang) {
  return {
    slug: place.slug,
    type: place.type,
    name: localize(place.name, lang),
    coverPhoto: place.photos[0]?.url ?? null,
    address: place.address,
    phone: place.phone,
    whatsapp: place.whatsapp,
    lat: place.lat,
    lng: place.lng,
  };
}

function dates(request: RequestForList) {
  const dateFrom = formatDateOnly(request.dateFrom);
  const dateTo = request.dateTo ? formatDateOnly(request.dateTo) : null;

  return {
    dateFrom,
    dateTo,
    time: request.time,
    nights: dateTo ? nightsBetween(dateFrom, dateTo) : null,
  };
}

export function toRequestListItem(request: RequestForList, lang: Lang) {
  return {
    code: request.code,
    type: request.type,
    status: request.status,
    place: placeSummary(request.place, lang),
    ...dates(request),
    guests: request.guests,
    children: request.children,
    totalEstimate: money(request.totalEstimate),
    canCancel: canTransition(request.status, 'CANCELLED'),
    createdAt: request.createdAt,
  };
}

export function toRequestDetail(request: RequestForDetail, viewerId: number, lang: Lang) {
  return {
    ...toRequestListItem(request, lang),
    contact: {
      name: request.contactName,
      email: request.contactEmail,
      phone: request.contactPhone,
      whatsapp: request.contactWhatsapp,
    },
    note: request.note,
    specialRequests: request.specialRequests,
    items: request.items.map((item) => {
      const unitPrice = item.unitPrice.toNumber();
      return {
        id: item.id,
        kind: item.roomId ? ('ROOM' as const) : ('MENU_ITEM' as const),
        name: localize(item.room?.name ?? item.menuItem?.name, lang),
        quantity: item.quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
        note: item.note,
      };
    }),
    declineReason: request.declineReason,
    respondedAt: request.respondedAt,
    cancelledAt: request.cancelledAt,
    canReview: request.status === 'ARRIVED' && request.review === null,
    messages: request.messages.map((message) => toMessage(message, viewerId)),
  };
}

export function toMessage(
  message: { id: number; text: string; createdAt: Date; sender: { id: number; fullName: string } },
  viewerId: number,
) {
  return {
    id: message.id,
    text: message.text,
    fromMe: message.sender.id === viewerId,
    senderName: shortName(message.sender.fullName),
    createdAt: message.createdAt,
  };
}

// Data for the email templates
export function toRequestSummary(request: RequestForList, lang: Lang = 'en'): RequestSummary {
  const { dateFrom, dateTo, time } = dates(request);

  return {
    code: request.code,
    type: request.type,
    placeName: localize(request.place.name, lang),
    dateFrom,
    dateTo,
    time,
    guests: request.guests,
    children: request.children,
    contactName: request.contactName,
    contactEmail: request.contactEmail,
    contactPhone: request.contactPhone,
    contactWhatsapp: request.contactWhatsapp,
    note: request.note,
    totalEstimate: money(request.totalEstimate),
  };
}
