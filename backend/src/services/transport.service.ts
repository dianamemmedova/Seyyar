import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { localize, type Lang } from '../lib/i18n';
import { NotFoundError } from '../lib/errors';
import { groupPrice, planRoutes, type Leg } from '../lib/route-planner';
import type { PlanQuery, RoutesQuery } from '../schemas/transport.schema';

const routeInclude = {
  steps: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.TransportRouteInclude;

type RouteWithSteps = Prisma.TransportRouteGetPayload<{ include: typeof routeInclude }>;

// Stored routes only in the active region (Baku for now)
const ACTIVE = {
  OR: [{ regionId: null }, { region: { isActive: true } }],
} satisfies Prisma.TransportRouteWhereInput;

const toLeg = (route: RouteWithSteps): Leg & { route: RouteWithSteps } => ({
  id: route.id,
  fromKey: route.fromKey,
  toKey: route.toKey,
  priceMin: route.priceMin.toNumber(),
  priceMax: route.priceMax?.toNumber() ?? null,
  priceUnit: route.priceUnit,
  durationMin: route.durationMin,
  transfers: route.transfers,
  walkMeters: route.walkMeters,
  isPopular: route.isPopular,
  route,
});

function localizeTags(tags: Prisma.JsonValue, lang: Lang): string[] {
  return Array.isArray(tags) ? tags.map((tag) => localize(tag, lang)).filter(Boolean) : [];
}

function toRouteCard(route: RouteWithSteps, lang: Lang, people = 1) {
  const priceMin = route.priceMin.toNumber();
  const priceMax = route.priceMax?.toNumber() ?? null;

  return {
    slug: route.slug,
    from: { key: route.fromKey, label: localize(route.fromLabel, lang) },
    to: { key: route.toKey, label: localize(route.toLabel, lang) },
    mode: route.mode,
    priceMin,
    priceMax,
    priceUnit: route.priceUnit,
    // What the whole group pays (taxi is shared, metro tickets are per person)
    groupPriceMin: groupPrice(priceMin, route.priceUnit, people),
    groupPriceMax: priceMax === null ? null : groupPrice(priceMax, route.priceUnit, people),
    durationMin: route.durationMin,
    transfers: route.transfers,
    walkMeters: route.walkMeters,
    tags: localizeTags(route.tags, lang),
    isPopular: route.isPopular,
    updatedAt: route.updatedAt,
  };
}

function toRouteDetail(route: RouteWithSteps, lang: Lang, people = 1) {
  return {
    ...toRouteCard(route, lang, people),
    steps: route.steps.map((step) => ({
      mode: step.mode,
      instruction: localize(step.instruction, lang),
      durationMin: step.durationMin,
      price: step.price?.toNumber() ?? null,
      photo: step.photo,
    })),
  };
}

export async function listRoutes(query: RoutesQuery) {
  const routes = await prisma.transportRoute.findMany({
    where: {
      ...ACTIVE,
      fromKey: query.from,
      toKey: query.to,
      mode: query.mode,
      isPopular: query.popular,
    },
    include: routeInclude,
    orderBy: [{ isPopular: 'desc' }, { durationMin: 'asc' }],
  });

  return routes.map((route) => toRouteCard(route, query.lang));
}

// Places the planner knows about (for the "From" / "To" dropdowns)
export async function listLocations(lang: Lang) {
  const routes = await prisma.transportRoute.findMany({
    where: ACTIVE,
    select: { fromKey: true, toKey: true, fromLabel: true, toLabel: true },
  });

  const locations = new Map<string, string>();
  for (const route of routes) {
    if (!locations.has(route.fromKey))
      locations.set(route.fromKey, localize(route.fromLabel, lang));
    if (!locations.has(route.toKey)) locations.set(route.toKey, localize(route.toLabel, lang));
  }

  return [...locations]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getRoute(slug: string, lang: Lang) {
  const route = await prisma.transportRoute.findFirst({
    where: { ...ACTIVE, slug },
    include: routeInclude,
  });

  if (!route) {
    throw new NotFoundError('Route');
  }

  return toRouteDetail(route, lang);
}

export async function planTrip(query: PlanQuery) {
  // Few routes exist, so loading all of them is cheap and keeps the planner simple
  const routes = await prisma.transportRoute.findMany({ where: ACTIVE, include: routeInclude });
  const legs = routes.map(toLeg);

  const options = planRoutes(legs, query.from, query.to, query.people, query.sort);

  const labelOf = (key: string) => {
    const route = routes.find((item) => item.fromKey === key || item.toKey === key);
    if (!route) return key;
    return localize(route.fromKey === key ? route.fromLabel : route.toLabel, query.lang);
  };

  return {
    from: { key: query.from, label: labelOf(query.from) },
    to: { key: query.to, label: labelOf(query.to) },
    people: query.people,
    options: options.map((option) => ({
      durationMin: option.durationMin,
      priceMin: option.priceMin,
      priceMax: option.priceMax,
      transfers: option.transfers,
      walkMeters: option.walkMeters,
      isCheapest: option.isCheapest,
      isFastest: option.isFastest,
      legs: option.legs.map((leg) => toRouteDetail(leg.route, query.lang, query.people)),
    })),
  };
}
