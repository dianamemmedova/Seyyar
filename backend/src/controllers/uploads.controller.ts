import type { Request, Response } from 'express';
import * as uploadsService from '../services/uploads.service';

// req.files is filled by multer (imageUpload.array) before the controller runs
const filesOf = (req: Request) => req.files as Express.Multer.File[] | undefined;

export async function reviewPhotos(req: Request, res: Response) {
  const images = await uploadsService.uploadImages(filesOf(req), 'reviews');
  res.status(201).json({ data: images });
}

export async function placePhotos(req: Request, res: Response) {
  const images = await uploadsService.uploadImages(filesOf(req), 'places');
  res.status(201).json({ data: images });
}
