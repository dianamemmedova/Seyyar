import type { Request, Response } from 'express';
import * as itinerariesService from '../services/itineraries.service';
import { langQuerySchema, slugParamsSchema } from '../schemas/places.schema';

export async function list(req: Request, res: Response) {
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await itinerariesService.listItineraries(lang) });
}

export async function detail(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await itinerariesService.getItinerary(slug, lang) });
}
