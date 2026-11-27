import type { RequestStatus } from '../generated/prisma/client';
import { ConflictError } from './errors';

// Which status can follow which (acceptance criterion B7-10)
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['ARRIVED', 'NO_SHOW', 'CANCELLED'],
  DECLINED: [],
  EXPIRED: [],
  CANCELLED: [],
  ARRIVED: [],
  NO_SHOW: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    throw new ConflictError(
      `Cannot change request status from ${from} to ${to}`,
      'INVALID_STATUS_TRANSITION',
    );
  }
}

// Tabs on the "My requests" page
export const STATUS_GROUPS: Record<'active' | 'past' | 'cancelled', RequestStatus[]> = {
  active: ['NEW', 'CONFIRMED'],
  past: ['ARRIVED', 'NO_SHOW', 'DECLINED', 'EXPIRED'],
  cancelled: ['CANCELLED'],
};
