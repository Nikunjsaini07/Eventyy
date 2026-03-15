import { Router } from 'express';
import { generateBracketHandler, updateMatchResultHandler } from '../controllers/match.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { updateMatchResultSchema } from '../validators/match.validator.js';

const router = Router();

router.post('/games/:gameId/bracket', authenticate, authorize('ADMIN', 'COORDINATOR'), generateBracketHandler);
router.patch('/:matchId/result', authenticate, authorize('ADMIN', 'COORDINATOR'), validate(updateMatchResultSchema), updateMatchResultHandler);

export default router;
