// Pure planning logic (no database), so it is easy to test.
// A "leg" is one stored route, e.g. airport -> city-center by taxi.

export type PriceUnit = 'PER_PERSON' | 'PER_VEHICLE';

export type Leg = {
  id: number;
  fromKey: string;
  toKey: string;
  priceMin: number;
  priceMax: number | null;
  priceUnit: PriceUnit;
  durationMin: number;
  transfers: number;
  walkMeters: number;
  isPopular: boolean;
};

export type PlanSort = 'recommended' | 'cheapest' | 'fastest';

export type PlanOption<T extends Leg> = {
  legs: T[];
  durationMin: number;
  priceMin: number;
  priceMax: number;
  transfers: number;
  walkMeters: number;
  isCheapest: boolean;
  isFastest: boolean;
};

// Time lost when changing from one leg to the next (walking, waiting)
export const CHANGE_PENALTY_MIN = 10;
const MAX_OPTIONS = 6;

const round2 = (value: number) => Math.round(value * 100) / 100;

// Price for the whole group: per-person prices are multiplied, a taxi is shared
export function groupPrice(price: number, unit: PriceUnit, people: number): number {
  return unit === 'PER_PERSON' ? price * people : price;
}

function toOption<T extends Leg>(legs: T[], people: number): PlanOption<T> {
  const changes = legs.length - 1;

  return {
    legs,
    durationMin: legs.reduce((sum, leg) => sum + leg.durationMin, 0) + changes * CHANGE_PENALTY_MIN,
    priceMin: round2(
      legs.reduce((sum, leg) => sum + groupPrice(leg.priceMin, leg.priceUnit, people), 0),
    ),
    priceMax: round2(
      legs.reduce(
        (sum, leg) => sum + groupPrice(leg.priceMax ?? leg.priceMin, leg.priceUnit, people),
        0,
      ),
    ),
    transfers: legs.reduce((sum, leg) => sum + leg.transfers, 0) + changes,
    walkMeters: legs.reduce((sum, leg) => sum + leg.walkMeters, 0),
    isCheapest: false,
    isFastest: false,
  };
}

// Direct routes first; if there are none, combinations with one change (A -> X -> B)
export function planRoutes<T extends Leg>(
  legs: T[],
  from: string,
  to: string,
  people: number,
  sort: PlanSort,
): PlanOption<T>[] {
  const direct = legs.filter((leg) => leg.fromKey === from && leg.toKey === to);
  let options: PlanOption<T>[];

  if (direct.length > 0) {
    options = direct.map((leg) => toOption([leg], people));
  } else {
    options = [];
    for (const first of legs.filter((leg) => leg.fromKey === from && leg.toKey !== to)) {
      for (const second of legs.filter((leg) => leg.fromKey === first.toKey && leg.toKey === to)) {
        options.push(toOption([first, second], people));
      }
    }
  }

  if (options.length === 0) return [];

  const cheapest = Math.min(...options.map((option) => option.priceMin));
  const fastest = Math.min(...options.map((option) => option.durationMin));
  for (const option of options) {
    option.isCheapest = option.priceMin === cheapest;
    option.isFastest = option.durationMin === fastest;
  }

  const popular = (option: PlanOption<T>) => option.legs.every((leg) => leg.isPopular);

  options.sort((a, b) => {
    if (sort === 'cheapest') return a.priceMin - b.priceMin || a.durationMin - b.durationMin;
    if (sort === 'fastest') return a.durationMin - b.durationMin || a.priceMin - b.priceMin;
    // recommended: popular routes first, then fewer changes, then faster
    return (
      Number(popular(b)) - Number(popular(a)) ||
      a.legs.length - b.legs.length ||
      a.durationMin - b.durationMin
    );
  });

  return options.slice(0, MAX_OPTIONS);
}
