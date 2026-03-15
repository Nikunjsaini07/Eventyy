import { Router } from 'express';
import { registerParticipantHandler } from '../controllers/participant.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), registerParticipantHandler);

export default router;
