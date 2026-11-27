import { Router } from 'express';
import * as controller from '../controllers/itineraries.controller';

const router = Router();

router.get('/', controller.list);
router.get('/:slug', controller.detail);

export default router;
