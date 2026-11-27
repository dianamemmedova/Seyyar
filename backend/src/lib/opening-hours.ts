const BAKU_TIME_ZONE = 'Asia/Baku';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type HoursRow = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

// Current day (0 = Monday) and time ("14:05") in Baku, whatever the server's time zone is
export function bakuClock(date = new Date()): { dayOfWeek: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BAKU_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    dayOfWeek: WEEKDAYS.indexOf(get('weekday')),
    time: `${get('hour')}:${get('minute')}`,
  };
}

// true = open, false = closed, null = no opening hours (open-air places, hotels)
export function isOpenAt(hours: HoursRow[], date = new Date()): boolean | null {
  if (hours.length === 0) return null;

  const { dayOfWeek, time } = bakuClock(date);
  const today = hours.find((row) => row.dayOfWeek === dayOfWeek);
  const yesterday = hours.find((row) => row.dayOfWeek === (dayOfWeek + 6) % 7);

  // Still open after midnight from yesterday (e.g. 18:00 - 02:00)
  if (
    yesterday &&
    !yesterday.isClosed &&
    yesterday.opensAt &&
    yesterday.closesAt &&
    yesterday.closesAt <= yesterday.opensAt &&
    time < yesterday.closesAt
  ) {
    return true;
  }

  if (!today || today.isClosed || !today.opensAt || !today.closesAt) return false;

  // Normal day (10:00 - 18:00)
  if (today.closesAt > today.opensAt) {
    return time >= today.opensAt && time < today.closesAt;
  }

  // Closes after midnight (18:00 - 02:00 or 10:00 - 00:00): open from opensAt until midnight
  return time >= today.opensAt;
}

export function todayHours(hours: HoursRow[], date = new Date()): HoursRow | null {
  const { dayOfWeek } = bakuClock(date);
  return hours.find((row) => row.dayOfWeek === dayOfWeek) ?? null;
}
