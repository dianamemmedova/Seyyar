import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { config } from '../config';
import { BadRequestError } from './errors';

// Sub-folders inside UPLOAD_DIR
export const IMAGE_FOLDERS = ['reviews', 'places'] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

const MAX_SIDE = 1600;

export const uploadRoot = path.resolve(config.UPLOAD_DIR);

export type SavedImage = { url: string; width: number; height: number; bytes: number };

// Turns any accepted image into a WebP of at most 1600x1600.
// sharp also drops EXIF data (camera, GPS location) and fails on files that are not real images.
export async function saveImage(buffer: Buffer, folder: ImageFolder): Promise<SavedImage> {
  const output = await sharp(buffer)
    .rotate() // respect the phone's orientation before the EXIF data is removed
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new BadRequestError('The file is not a valid image', 'INVALID_IMAGE');
    });

  const fileName = `${randomUUID()}.webp`;
  const directory = path.join(uploadRoot, folder);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), output.data);

  return {
    url: `${config.PUBLIC_API_URL}/uploads/${folder}/${fileName}`,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
  };
}

const UUID_WEBP = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.webp';
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// True only for URLs created by saveImage (so nobody can attach links to other websites)
export function isUploadedImageUrl(url: string, folder: ImageFolder): boolean {
  const pattern = new RegExp(
    `^${escapeRegex(config.PUBLIC_API_URL)}/uploads/${folder}/${UUID_WEBP}$`,
  );
  return pattern.test(url);
}
