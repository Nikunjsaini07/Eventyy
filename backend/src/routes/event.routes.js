import { Router } from 'express';
import {
  analyticsHandler,
  assignCoordinatorHandler,
  createEventHandler,
  deleteEventHandler,
  listEventsHandler,
  updateEventHandler
} from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { assignCoordinatorSchema, createEventSchema, updateEventSchema } from '../validators/event.validator.js';

const router = Router();

router.get('/', listEventsHandler);
router.get('/analytics', authenticate, authorize('ADMIN'), analyticsHandler);
router.post('/', authenticate, authorize('ADMIN'), validate(createEventSchema), createEventHandler);
router.patch('/:eventId', authenticate, authorize('ADMIN'), validate(updateEventSchema), updateEventHandler);
router.delete('/:eventId', authenticate, authorize('ADMIN'), deleteEventHandler);
router.post('/:eventId/coordinators', authenticate, authorize('ADMIN'), validate(assignCoordinatorSchema), assignCoordinatorHandler);

export default router;
