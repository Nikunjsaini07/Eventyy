import { asyncHandler } from '../utils/asyncHandler.js';
import { getLeaderboard } from '../services/leaderboard.service.js';

export const getLeaderboardHandler = asyncHandler(async (req, res) => {
  const leaderboard = await getLeaderboard(req.query);
  res.status(200).json(leaderboard);
});
