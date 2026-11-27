const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date in Baku as "YYYY-MM-DD" (en-CA formats dates exactly like that)
export function bakuToday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(date);
}

// "2026-12-10" -> Date at midnight UTC (how Prisma stores @db.Date)
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

// Date -> "2026-12-10"
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  return formatDateOnly(new Date(parseDateOnly(value).getTime() + days * DAY_MS));
}

export function nightsBetween(from: string, to: string): number {
  return Math.round((parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / DAY_MS);
}

// 0 = Monday ... 6 = Sunday (same as OpeningHours.dayOfWeek)
export function weekdayOf(value: string): number {
  return (parseDateOnly(value).getUTCDay() + 6) % 7;
}
