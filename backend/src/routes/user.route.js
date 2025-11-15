import { Router } from 'express';
import { getAllUsers } from '../controller/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, getAllUsers);
// TODO: Get Messages Between Users

export default router;