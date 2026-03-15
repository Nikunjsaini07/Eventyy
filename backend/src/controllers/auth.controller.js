import { asyncHandler } from '../utils/asyncHandler.js';
import { loginWithRollNumber, refreshUserSession, registerStudent, revokeRefreshToken } from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await registerStudent(req.body);
  res.status(201).json({ id: user.id, rollNumber: user.rollNumber, email: user.email });
});

export const login = asyncHandler(async (req, res) => {
  const tokens = await loginWithRollNumber(req.body);
  res.status(200).json(tokens);
});

export const refresh = asyncHandler(async (req, res) => {
  const tokens = await refreshUserSession(req.body.refreshToken);
  res.status(200).json(tokens);
});

export const logout = asyncHandler(async (req, res) => {
  await revokeRefreshToken(req.body.refreshToken);
  res.status(200).json({ message: 'Logged out successfully' });
});
