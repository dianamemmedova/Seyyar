import { BadRequestError } from '../lib/errors';
import { saveImage, type ImageFolder, type SavedImage } from '../lib/images';

export async function uploadImages(
  files: Express.Multer.File[] | undefined,
  folder: ImageFolder,
): Promise<SavedImage[]> {
  if (!files || files.length === 0) {
    throw new BadRequestError('Select at least one image (form field "photos")', 'NO_FILES');
  }

  // One after another: converting images uses a lot of memory and CPU
  const saved: SavedImage[] = [];
  for (const file of files) {
    saved.push(await saveImage(file.buffer, folder));
  }

  return saved;
}
