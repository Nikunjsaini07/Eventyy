import { Request, Response } from "express";

import {
  assignCoordinator,
  deactivateCoordinatorAssignment
} from "../services/coordinator.service";
import {
  createEvent,
  createEventGroup,
  deleteEvent,
  deleteEventGroup,
  listAdminEventGroups,
  listAdminEvents,
  updateEvent,
  updateEventGroup
} from "../services/event.service";
import { getSiteContent, updateSiteContent } from "../services/site.service";
import {
  createAdminAccount,
  listUsers,
  promoteToAdmin,
  reviewUniversityBadge,
  setUserActiveState
} from "../services/user.service";

export const listUsersController = async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.status(200).json(users);
};

export const listAdminEventsController = async (_req: Request, res: Response) => {
  const events = await listAdminEvents();
  res.status(200).json(events);
};

export const listAdminEventGroupsController = async (_req: Request, res: Response) => {
  const groups = await listAdminEventGroups();
  res.status(200).json(groups);
};

export const getSiteContentController = async (_req: Request, res: Response) => {
  const content = await getSiteContent();
  res.status(200).json(content);
};

export const updateSiteContentController = async (req: Request, res: Response) => {
  const content = await updateSiteContent(req.body);
  res.status(200).json(content);
};

export const promoteToAdminController = async (req: Request, res: Response) => {
  const user = await promoteToAdmin(String(req.params.userId));
  res.status(200).json(user);
};

export const createAdminController = async (req: Request, res: Response) => {
  const user = await createAdminAccount(req.body);
  res.status(201).json(user);
};

export const activateUserController = async (req: Request, res: Response) => {
  const user = await setUserActiveState(req.user!.id, String(req.params.userId), true);
  res.status(200).json(user);
};

export const deactivateUserController = async (req: Request, res: Response) => {
  const user = await setUserActiveState(req.user!.id, String(req.params.userId), false);
  res.status(200).json(user);
};

export const reviewUniversityBadgeController = async (req: Request, res: Response) => {
  const result = await reviewUniversityBadge(req.user!.id, String(req.params.userId), req.body);
  res.status(200).json(result);
};

export const createEventGroupController = async (req: Request, res: Response) => {
  const group = await createEventGroup(req.user!.id, req.body);
  res.status(201).json(group);
};

export const updateEventGroupController = async (req: Request, res: Response) => {
  const group = await updateEventGroup(String(req.params.groupId), req.body);
  res.status(200).json(group);
};

export const deleteEventGroupController = async (req: Request, res: Response) => {
  const result = await deleteEventGroup(String(req.params.groupId));
  res.status(200).json(result);
};

export const createEventController = async (req: Request, res: Response) => {
  const event = await createEvent(req.user!.id, req.body);
  res.status(201).json(event);
};

export const updateEventController = async (req: Request, res: Response) => {
  const event = await updateEvent(String(req.params.eventId), req.body);
  res.status(200).json(event);
};

export const deleteEventController = async (req: Request, res: Response) => {
  const result = await deleteEvent(String(req.params.eventId));
  res.status(200).json(result);
};

export const assignCoordinatorController = async (req: Request, res: Response) => {
  const assignment = await assignCoordinator(req.user!.id, String(req.params.eventId), req.body);
  res.status(201).json(assignment);
};

export const deactivateCoordinatorAssignmentController = async (req: Request, res: Response) => {
  const assignment = await deactivateCoordinatorAssignment(String(req.params.assignmentId));
  res.status(200).json(assignment);
};
