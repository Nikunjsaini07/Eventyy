import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import gameRoutes from './game.routes.js';
import participantRoutes from './participant.routes.js';
import matchRoutes from './match.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/games', gameRoutes);
router.use('/participants', participantRoutes);
router.use('/matches', matchRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;
