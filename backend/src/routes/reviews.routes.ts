import { Router } from 'express';
import * as controller from '../controllers/reviews.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', controller.create);
router.get('/my', controller.listMine);

export default router;
