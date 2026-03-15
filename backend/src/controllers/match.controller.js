import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSingleEliminationBracket, updateMatchResult } from '../services/match.service.js';

export const generateBracketHandler = asyncHandler(async (req, res) => {
  const matches = await generateSingleEliminationBracket(req.params.gameId);
  res.status(201).json(matches);
});

export const updateMatchResultHandler = asyncHandler(async (req, res) => {
  const match = await updateMatchResult(req.params.matchId, req.body.winnerId, req.body.scoreData);
  res.status(200).json(match);
});
