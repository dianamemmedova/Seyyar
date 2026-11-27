import { Router } from 'express';
import * as controller from '../controllers/places.controller';

const router = Router();

router.get('/', controller.home);

export default router;
