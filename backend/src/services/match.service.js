import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { updateLeaderboardForWinner } from './leaderboard.service.js';

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export const generateSingleEliminationBracket = async (gameId) => {
  const participants = await prisma.participant.findMany({ where: { gameId } });
  if (participants.length < 2) throw new ApiError(400, 'At least 2 participants are needed');

  const randomized = shuffle(participants);
  const matches = [];
  for (let i = 0; i < randomized.length - 1; i += 2) {
    matches.push({ gameId, roundNumber: 1, participant1Id: randomized[i].id, participant2Id: randomized[i + 1].id });
  }

  return prisma.match.createManyAndReturn({ data: matches });
};

export const updateMatchResult = async (matchId, winnerId, scoreData) => {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { game: true } });
  if (!match) throw new ApiError(404, 'Match not found');

  if (![match.participant1Id, match.participant2Id].includes(winnerId)) {
    throw new ApiError(400, 'Winner must be one of the participants in the match');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.match.update({ where: { id: matchId }, data: { winnerId, scoreData } });

    const winnerParticipant = await tx.participant.findUnique({ where: { id: winnerId } });

    const allRoundMatches = await tx.match.findMany({ where: { gameId: match.gameId, roundNumber: match.roundNumber } });
    const isRoundComplete = allRoundMatches.every((m) => m.winnerId || m.id === matchId);

    if (isRoundComplete) {
      const completed = await tx.match.findMany({ where: { gameId: match.gameId, roundNumber: match.roundNumber, winnerId: { not: null } } });
      if (completed.length === 1 && allRoundMatches.length === 1) {
        const year = new Date().getFullYear();
        await tx.winner.create({
          data: {
            gameId: match.gameId,
            studentId: winnerParticipant.studentId,
            position: '1st',
            year
          }
        });
        await updateLeaderboardForWinner(tx, winnerParticipant.studentId, '1st');
      } else {
        const nextRound = match.roundNumber + 1;
        for (let i = 0; i < completed.length - 1; i += 2) {
          await tx.match.create({
            data: {
              gameId: match.gameId,
              roundNumber: nextRound,
              participant1Id: completed[i].winnerId,
              participant2Id: completed[i + 1].winnerId
            }
          });
        }
      }
    }

    return updated;
  });
};
