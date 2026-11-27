import type { Request, Response } from 'express';
import * as placesService from '../services/places.service';
import {
  filtersQuerySchema,
  langQuerySchema,
  listPlacesQuerySchema,
  mapQuerySchema,
  nearbyQuerySchema,
  reviewsQuerySchema,
  slugParamsSchema,
} from '../schemas/places.schema';

export async function list(req: Request, res: Response) {
  const query = listPlacesQuerySchema.parse(req.query);
  const { items, meta } = await placesService.listPlaces(query);
  res.json({ data: items, meta });
}

export async function map(req: Request, res: Response) {
  const query = mapQuerySchema.parse(req.query);
  res.json({ data: await placesService.getMapPoints(query) });
}

export async function filters(req: Request, res: Response) {
  const query = filtersQuerySchema.parse(req.query);
  res.json({ data: await placesService.getFilterOptions(query) });
}

export async function detail(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await placesService.getPlaceBySlug(slug, lang) });
}

export async function reviews(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  const query = reviewsQuerySchema.parse(req.query);
  const { items, meta } = await placesService.getPlaceReviews(slug, query);
  res.json({ data: items, meta });
}

export async function nearby(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  const query = nearbyQuerySchema.parse(req.query);
  res.json({ data: await placesService.getNearbyPlaces(slug, query) });
}

export async function home(req: Request, res: Response) {
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await placesService.getHome(lang) });
}
