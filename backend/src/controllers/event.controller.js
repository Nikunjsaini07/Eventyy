import { asyncHandler } from '../utils/asyncHandler.js';
import { assignCoordinator, createEvent, deleteEvent, getEventAnalytics, listEvents, updateEvent } from '../services/event.service.js';

export const createEventHandler = asyncHandler(async (req, res) => {
  const event = await createEvent(req.body, req.user.id);
  res.status(201).json(event);
});

export const updateEventHandler = asyncHandler(async (req, res) => {
  const event = await updateEvent(req.params.eventId, req.body);
  res.status(200).json(event);
});

export const deleteEventHandler = asyncHandler(async (req, res) => {
  await deleteEvent(req.params.eventId);
  res.status(204).send();
});

export const listEventsHandler = asyncHandler(async (req, res) => {
  const events = await listEvents(req.query);
  res.status(200).json(events);
});

export const assignCoordinatorHandler = asyncHandler(async (req, res) => {
  const assignment = await assignCoordinator(req.params.eventId, req.body.coordinatorId);
  res.status(200).json(assignment);
});

export const analyticsHandler = asyncHandler(async (_req, res) => {
  const analytics = await getEventAnalytics();
  res.status(200).json(analytics);
});
