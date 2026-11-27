import { Router } from 'express';
import * as controller from '../controllers/forms.controller';
import { formLimiter } from '../middleware/rate-limit';

const router = Router();

// Public forms: no login, but limited per IP
router.post('/contact', formLimiter, controller.contact);
router.post('/subscribe', formLimiter, controller.subscribe);
router.post('/partners/apply', formLimiter, controller.applyAsPartner);

router.get('/faq', controller.faq);

export default router;
