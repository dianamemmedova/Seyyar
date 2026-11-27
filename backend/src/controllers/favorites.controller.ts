import type { Request, Response } from 'express';
import * as favoritesService from '../services/favorites.service';
import { favoritesQuerySchema } from '../schemas/favorites.schema';
import { slugParamsSchema } from '../schemas/places.schema';

export async function list(req: Request, res: Response) {
  const query = favoritesQuerySchema.parse(req.query);
  const { items, meta } = await favoritesService.listFavorites(req.user!.id, query);
  res.json({ data: items, meta });
}

export async function slugs(req: Request, res: Response) {
  res.json({ data: await favoritesService.listFavoriteSlugs(req.user!.id) });
}

export async function add(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  await favoritesService.addFavorite(req.user!.id, slug);
  res.json({ data: { slug, isFavorite: true } });
}

export async function remove(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params);
  await favoritesService.removeFavorite(req.user!.id, slug);
  res.status(204).end();
}
