import { Router } from 'express';
import * as controller from '../controllers/transport.controller';

const router = Router();

// Fixed paths first, otherwise "/plan" would be treated as a slug
router.get('/', controller.list);
router.get('/locations', controller.locations);
router.get('/plan', controller.plan);
router.get('/:slug', controller.detail);

export default router;
