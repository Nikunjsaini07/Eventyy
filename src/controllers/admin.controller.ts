import { Request, Response } from "express";

import { createEvent, deleteEvent, updateEvent } from "../services/event.service";
import {
  assignCoordinator,
  deactivateCoordinatorAssignment,
  listCoordinatorAssignments,
  listUsers,
  promoteToAdmin,
  reviewUniversityBadge
} from "../services/user.service";

export const listUsersController = async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.status(200).json(users);
};

export const promoteToAdminController = async (req: Request, res: Response) => {
  const user = await promoteToAdmin(String(req.params.userId));
  res.status(200).json(user);
};

export const reviewUniversityBadgeController = async (req: Request, res: Response) => {
  const result = await reviewUniversityBadge(req.user!.id, String(req.params.userId), req.body);
  res.status(200).json(result);
};

export const listCoordinatorAssignmentsController = async (_req: Request, res: Response) => {
  const assignments = await listCoordinatorAssignments();
  res.status(200).json(assignments);
};

export const assignCoordinatorController = async (req: Request, res: Response) => {
  const assignment = await assignCoordinator(req.user!.id, req.body);
  res.status(201).json(assignment);
};

export const deactivateCoordinatorAssignmentController = async (
  req: Request,
  res: Response
) => {
  const assignment = await deactivateCoordinatorAssignment(String(req.params.assignmentId));
  res.status(200).json(assignment);
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

