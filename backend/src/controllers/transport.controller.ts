import type { Request, Response } from 'express';
import * as transportService from '../services/transport.service';
import { planQuerySchema, routesQuerySchema } from '../schemas/transport.schema';
import { langQuerySchema, slugParamsSchema } from '../schemas/places.schema';

export async function list(req: Request, res: Response) {
  const query = routesQuerySchema.parse(req.query);
  res.json({ data: await transportService.listRoutes(query) });
}

export async function locations(req: Request, res: Response) {
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await transportService.listLocations(lang) });
}

export async function plan(req: Request, res: Response) {
  const query = planQuerySchema.parse(req.query);
  res.json({ data: await transportService.planTrip(query) });
}

export async function detail(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  const { lang } = langQuerySchema.parse(req.query);
  res.json({ data: await transportService.getRoute(slug, lang) });
}
