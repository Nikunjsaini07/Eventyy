import { Request, Response } from "express";

import {
  cancelEventRegistration,
  getEventById,
  getEventGroupById,
  listEventGroups,
  listEvents,
  registerForSoloEvent,
  registerTeamForEvent
} from "../services/event.service";

export const listEventsController = async (req: Request, res: Response) => {
  const events = await listEvents(req.user?.id, req.query as never);
  res.status(200).json(events);
};

export const listEventGroupsController = async (req: Request, res: Response) => {
  const groups = await listEventGroups(req.user?.id);
  res.status(200).json(groups);
};

export const getEventGroupByIdController = async (req: Request, res: Response) => {
  const group = await getEventGroupById(String(req.params.groupId), req.user?.id);
  res.status(200).json(group);
};

export const getEventByIdController = async (req: Request, res: Response) => {
  const event = await getEventById(String(req.params.eventId), req.user?.id);
  res.status(200).json(event);
};

export const registerForSoloEventController = async (req: Request, res: Response) => {
  const registration = await registerForSoloEvent(String(req.params.eventId), req.user!.id);
  res.status(201).json(registration);
};

export const registerTeamForEventController = async (req: Request, res: Response) => {
  const registration = await registerTeamForEvent(String(req.params.eventId), req.user!.id, req.body);
  res.status(201).json(registration);
};

export const cancelEventRegistrationController = async (req: Request, res: Response) => {
  const registration = await cancelEventRegistration(String(req.params.eventId), req.user!.id);
  res.status(200).json(registration);
};
