import { Request, Response } from "express";

import {
  createMatches,
  listEventRegistrations,
  publishResults,
  recordMatchResult,
  syncRounds,
  upsertLeaderboard
} from "../services/competition.service";

export const syncRoundsController = async (req: Request, res: Response) => {
  const rounds = await syncRounds(req.user!.id, req.user!.role, String(req.params.eventId), req.body);
  res.status(200).json(rounds);
};

export const createMatchesController = async (req: Request, res: Response) => {
  const matches = await createMatches(req.user!.id, req.user!.role, String(req.params.eventId), req.body);
  res.status(201).json(matches);
};

export const recordMatchResultController = async (req: Request, res: Response) => {
  const match = await recordMatchResult(req.user!.id, req.user!.role, String(req.params.matchId), req.body);
  res.status(200).json(match);
};

export const upsertLeaderboardController = async (req: Request, res: Response) => {
  const leaderboard = await upsertLeaderboard(
    req.user!.id,
    req.user!.role,
    String(req.params.eventId),
    req.body
  );
  res.status(200).json(leaderboard);
};

export const publishResultsController = async (req: Request, res: Response) => {
  const results = await publishResults(req.user!.id, req.user!.role, String(req.params.eventId), req.body);
  res.status(200).json(results);
};

export const listEventRegistrationsController = async (req: Request, res: Response) => {
  const registrations = await listEventRegistrations(
    req.user!.id,
    req.user!.role,
    String(req.params.eventId)
  );
  res.status(200).json(registrations);
};
