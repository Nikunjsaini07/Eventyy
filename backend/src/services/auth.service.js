import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/authTokens.js';

const buildTokenPayload = (user) => ({ sub: user.id, role: user.role });

export const registerStudent = async (payload) => {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: payload.email }, { rollNumber: payload.rollNumber }] } });
  if (existing) throw new ApiError(409, 'User with email or roll number already exists');

  const passwordHash = await bcrypt.hash(payload.password, 12);
  return prisma.user.create({
    data: {
      rollNumber: payload.rollNumber,
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: 'STUDENT',
      department: payload.department
    }
  });
};

const issueSessionTokens = async (user) => {
  const accessToken = signAccessToken(buildTokenPayload(user));
  const refreshToken = signRefreshToken(buildTokenPayload(user));

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
    }
  });

  return { accessToken, refreshToken };
};

export const loginWithRollNumber = async ({ rollNumber, password }) => {
  const user = await prisma.user.findUnique({ where: { rollNumber } });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) throw new ApiError(401, 'Invalid credentials');

  return issueSessionTokens(user);
};

export const refreshUserSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const hashed = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashed, userId: decoded.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true }
  });
  if (!storedToken || !storedToken.user.isActive) throw new ApiError(401, 'Refresh token expired or revoked');

  return prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
    const accessToken = signAccessToken(buildTokenPayload(storedToken.user));
    const newRefreshToken = signRefreshToken(buildTokenPayload(storedToken.user));
    await tx.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      }
    });
    return { accessToken, refreshToken: newRefreshToken };
  });
};

export const revokeRefreshToken = async (refreshToken) => {
  const hashed = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash: hashed, revokedAt: null }, data: { revokedAt: new Date() } });
};
