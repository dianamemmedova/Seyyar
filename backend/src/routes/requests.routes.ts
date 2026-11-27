import { Router } from 'express';
import * as controller from '../controllers/requests.controller';
import { requireAuth } from '../middleware/auth';
import { createRequestLimiter } from '../middleware/rate-limit';

const router = Router();

// Every request endpoint needs a logged-in user
router.use(requireAuth);

router.post('/', createRequestLimiter, controller.create);
router.get('/my', controller.listMine);
router.get('/:code', controller.getMine);
router.patch('/:code/cancel', controller.cancel);
router.post('/:code/messages', controller.addMessage);

export default router;
