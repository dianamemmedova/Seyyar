import { describe, expect, it } from 'vitest';
import { CHANGE_PENALTY_MIN, groupPrice, planRoutes, type Leg } from '../../src/lib/route-planner';

let nextId = 1;
const leg = (overrides: Partial<Leg> & Pick<Leg, 'fromKey' | 'toKey'>): Leg => ({
  id: nextId++,
  priceMin: 10,
  priceMax: null,
  priceUnit: 'PER_PERSON',
  durationMin: 30,
  transfers: 0,
  walkMeters: 0,
  isPopular: false,
  ...overrides,
});

const taxi = leg({
  fromKey: 'airport',
  toKey: 'center',
  priceMin: 25,
  priceMax: 35,
  priceUnit: 'PER_VEHICLE',
  durationMin: 30,
  isPopular: true,
});
const bus = leg({
  fromKey: 'airport',
  toKey: 'center',
  priceMin: 2,
  priceUnit: 'PER_PERSON',
  durationMin: 45,
  walkMeters: 200,
  isPopular: true,
});
const metro = leg({
  fromKey: 'center',
  toKey: 'station',
  priceMin: 0.5,
  durationMin: 20,
  transfers: 1,
});
const walk = leg({ fromKey: 'center', toKey: 'station', priceMin: 0, durationMin: 60 });
const legs = [taxi, bus, metro, walk];

describe('groupPrice', () => {
  it('multiplies per-person prices and shares vehicle prices', () => {
    expect(groupPrice(2, 'PER_PERSON', 3)).toBe(6);
    expect(groupPrice(30, 'PER_VEHICLE', 3)).toBe(30);
  });
});

describe('planRoutes: direct routes', () => {
  it('returns only direct options when they exist', () => {
    const options = planRoutes(legs, 'airport', 'center', 1, 'recommended');
    expect(options).toHaveLength(2);
    expect(options.every((option) => option.legs.length === 1)).toBe(true);
  });

  it('calculates the group total', () => {
    const options = planRoutes(legs, 'airport', 'center', 4, 'cheapest');
    const busOption = options.find((option) => option.legs[0] === bus)!;
    const taxiOption = options.find((option) => option.legs[0] === taxi)!;

    expect(busOption.priceMin).toBe(8); // 2 AZN x 4 people
    expect(busOption.priceMax).toBe(8); // no max price: same as min
    expect(taxiOption.priceMin).toBe(25); // one taxi for everybody
    expect(taxiOption.priceMax).toBe(35);
  });

  it('marks the cheapest and the fastest option', () => {
    const options = planRoutes(legs, 'airport', 'center', 1, 'recommended');
    expect(options.find((option) => option.legs[0] === bus)).toMatchObject({
      isCheapest: true,
      isFastest: false,
    });
    expect(options.find((option) => option.legs[0] === taxi)).toMatchObject({
      isCheapest: false,
      isFastest: true,
    });
  });

  it('sorts by price or by duration', () => {
    expect(planRoutes(legs, 'airport', 'center', 1, 'cheapest')[0].legs[0]).toBe(bus);
    expect(planRoutes(legs, 'airport', 'center', 1, 'fastest')[0].legs[0]).toBe(taxi);
  });

  it('puts popular routes first when recommended', () => {
    const quiet = leg({ fromKey: 'a', toKey: 'b', durationMin: 10 });
    const popular = leg({ fromKey: 'a', toKey: 'b', durationMin: 50, isPopular: true });
    expect(planRoutes([quiet, popular], 'a', 'b', 1, 'recommended')[0].legs[0]).toBe(popular);
  });
});

describe('planRoutes: one change', () => {
  it('combines two legs when there is no direct route', () => {
    const options = planRoutes(legs, 'airport', 'station', 1, 'fastest');

    // 2 ways to the center x 2 ways to the station
    expect(options).toHaveLength(4);
    expect(options.every((option) => option.legs.length === 2)).toBe(true);

    // taxi (30) + metro (20) + one change
    expect(options[0].legs).toEqual([taxi, metro]);
    expect(options[0].durationMin).toBe(50 + CHANGE_PENALTY_MIN);
    // metro has 1 transfer inside + 1 change between the legs
    expect(options[0].transfers).toBe(2);
  });

  it('adds up walking distance and prices of both legs', () => {
    const options = planRoutes(legs, 'airport', 'station', 2, 'cheapest');
    expect(options[0].legs).toEqual([bus, walk]);
    expect(options[0].priceMin).toBe(4); // (2 + 0) x 2 people
    expect(options[0].walkMeters).toBe(200);
  });
});

describe('planRoutes: edge cases', () => {
  it('returns an empty list when nothing connects the places', () => {
    expect(planRoutes(legs, 'airport', 'mars', 1, 'recommended')).toEqual([]);
  });

  it('returns at most 6 options', () => {
    const many = Array.from({ length: 10 }, () => leg({ fromKey: 'x', toKey: 'y' }));
    expect(planRoutes(many, 'x', 'y', 1, 'recommended')).toHaveLength(6);
  });
});
