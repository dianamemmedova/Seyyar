import type { Request, Response } from 'express';
import * as reviewsService from '../services/reviews.service';
import { createReviewSchema, myReviewsQuerySchema } from '../schemas/reviews.schema';
import { langQuerySchema } from '../schemas/places.schema';

export async function create(req: Request, res: Response) {
  const input = createReviewSchema.parse(req.body);
  const { lang } = langQuerySchema.parse(req.query);
  const review = await reviewsService.createReview(req.user!.id, input, lang);
  res.status(201).json({ data: review });
}

export async function listMine(req: Request, res: Response) {
  const query = myReviewsQuerySchema.parse(req.query);
  const { items, meta } = await reviewsService.listMyReviews(req.user!.id, query);
  res.json({ data: items, meta });
}
