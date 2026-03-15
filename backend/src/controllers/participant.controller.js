import { asyncHandler } from '../utils/asyncHandler.js';
import { registerParticipant } from '../services/participant.service.js';

export const registerParticipantHandler = asyncHandler(async (req, res) => {
  const payload = { gameId: req.body.gameId, studentId: req.user.id, teamId: req.body.teamId };
  const participant = await registerParticipant(payload);
  res.status(201).json(participant);
});
