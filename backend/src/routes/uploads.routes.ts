import { Router } from 'express';
import * as controller from '../controllers/uploads.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rate-limit';
import { imageUpload, MAX_FILES } from '../middleware/upload';

const router = Router();

router.use(requireAuth, uploadLimiter);

// Form field name is "photos" (multipart/form-data)
router.post('/reviews', imageUpload.array('photos', MAX_FILES), controller.reviewPhotos);
router.post(
  '/places',
  requireRole('ADMIN', 'PARTNER'),
  imageUpload.array('photos', MAX_FILES),
  controller.placePhotos,
);

export default router;
