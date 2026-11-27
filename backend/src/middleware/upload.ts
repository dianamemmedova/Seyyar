import multer from 'multer';
import { BadRequestError } from '../lib/errors';

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILES = 5;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Files are kept in memory: sharp converts them and only the WebP result is written to disk
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestError('Only JPG, PNG and WebP images are allowed', 'INVALID_FILE_TYPE'),
      );
      return;
    }
    callback(null, true);
  },
});
