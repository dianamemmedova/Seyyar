import { Router } from 'express';
import * as controller from '../controllers/favorites.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.get('/slugs', controller.slugs);
router.put('/:slug', controller.add);
router.delete('/:slug', controller.remove);

export default router;
