import { Request, Response } from "express";

import {
  listCoordinatorAssignedEvents,
  listEventRegistrationsForManager,
  reviewEventRegistration
} from "../services/coordinator.service";

export const listCoordinatorEventsController = async (req: Request, res: Response) => {
  const events = await listCoordinatorAssignedEvents(req.user!.id);
  res.status(200).json(events);
};

export const listManageableRegistrationsController = async (req: Request, res: Response) => {
  const registrations = await listEventRegistrationsForManager(
    String(req.params.eventId),
    req.user!.id
  );
  res.status(200).json(registrations);
};

export const reviewRegistrationController = async (req: Request, res: Response) => {
  const registration = await reviewEventRegistration(
    String(req.params.registrationId),
    req.user!.id,
    req.body
  );
  res.status(200).json(registration);
};
