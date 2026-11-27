import type { PlaceType } from './places.types';

export type RequestStatus =
  'NEW' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'ARRIVED' | 'NO_SHOW';

// Tabs on "My requests"
export type RequestTab = 'active' | 'past' | 'cancelled';

// GET /api/requests/my
export type RequestListItem = {
  code: string;
  type: 'HOTEL' | 'TABLE';
  status: RequestStatus;
  place: {
    slug: string;
    type: PlaceType;
    name: string;
    coverPhoto: string | null;
    address: string | null;
    phone: string | null;
    whatsapp: string | null;
    lat: number;
    lng: number;
  };
  dateFrom: string;
  dateTo: string | null;
  time: string | null;
  nights: number | null;
  guests: number;
  children: number;
  totalEstimate: number | null;
  canCancel: boolean;
  createdAt: string;
};

export type RequestMessage = {
  id: number;
  text: string;
  fromMe: boolean;
  senderName: string;
  createdAt: string;
};

// GET /api/requests/:code
export type RequestDetail = RequestListItem & {
  contact: { name: string; email: string; phone: string; whatsapp: boolean };
  note: string | null;
  specialRequests: string[];
  items: {
    id: number;
    kind: 'ROOM' | 'MENU_ITEM';
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    note: string | null;
  }[];
  declineReason: string | null;
  respondedAt: string | null;
  cancelledAt: string | null;
  canReview: boolean;
  messages: RequestMessage[];
};
