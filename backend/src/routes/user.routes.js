import { Router } from 'express';
import { activateUserHandler, banUserHandler } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.patch('/:userId/ban', authenticate, authorize('ADMIN'), banUserHandler);
router.patch('/:userId/activate', authenticate, authorize('ADMIN'), activateUserHandler);

export default router;
