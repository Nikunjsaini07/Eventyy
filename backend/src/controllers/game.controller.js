import { asyncHandler } from '../utils/asyncHandler.js';
import { createGame, listGames, updateGame } from '../services/game.service.js';

export const createGameHandler = asyncHandler(async (req, res) => {
  const game = await createGame(req.body, req.user);
  res.status(201).json(game);
});

export const updateGameHandler = asyncHandler(async (req, res) => {
  const game = await updateGame(req.params.gameId, req.body, req.user);
  res.status(200).json(game);
});

export const listGamesHandler = asyncHandler(async (req, res) => {
  const games = await listGames(req.query);
  res.status(200).json(games);
});
