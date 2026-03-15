import { asyncHandler } from '../utils/asyncHandler.js';
import { setUserActiveState } from '../services/user.service.js';

export const banUserHandler = asyncHandler(async (req, res) => {
  const updated = await setUserActiveState(req.params.userId, false);
  res.status(200).json(updated);
});

export const activateUserHandler = asyncHandler(async (req, res) => {
  const updated = await setUserActiveState(req.params.userId, true);
  res.status(200).json(updated);
});
