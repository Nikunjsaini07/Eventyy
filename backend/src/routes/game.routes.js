import { Router } from 'express';
import { createGameHandler, listGamesHandler, updateGameHandler } from '../controllers/game.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createGameSchema, updateGameSchema } from '../validators/game.validator.js';

const router = Router();

router.get('/', listGamesHandler);
router.post('/', authenticate, authorize('ADMIN', 'COORDINATOR'), validate(createGameSchema), createGameHandler);
router.patch('/:gameId', authenticate, authorize('ADMIN', 'COORDINATOR'), validate(updateGameSchema), updateGameHandler);

export default router;
