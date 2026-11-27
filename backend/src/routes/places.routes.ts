import { Router } from 'express';
import * as controller from '../controllers/places.controller';

const router = Router();

// Fixed paths first, otherwise "/map" would be treated as a slug
router.get('/', controller.list);
router.get('/map', controller.map);
router.get('/filters', controller.filters);

router.get('/:slug', controller.detail);
router.get('/:slug/reviews', controller.reviews);
router.get('/:slug/nearby', controller.nearby);

export default router;
