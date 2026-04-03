import { Request, Response } from "express";

import {
  getCurrentUser,
  login,
  registerStudent,
  requestEmailVerificationOtp,
  requestPasswordResetOtp,
  resetPassword,
  verifyEmailOtp
} from "../services/auth.service";

export const registerController = async (req: Request, res: Response) => {
  const result = await registerStudent(req.body);
  res.status(201).json(result);
};

export const loginController = async (req: Request, res: Response) => {
  const result = await login(req.body);
  res.status(200).json(result);
};

export const requestEmailVerificationOtpController = async (req: Request, res: Response) => {
  const result = await requestEmailVerificationOtp(req.body);
  res.status(200).json(result);
};

export const verifyEmailOtpController = async (req: Request, res: Response) => {
  const result = await verifyEmailOtp(req.body);
  res.status(200).json(result);
};

export const requestPasswordResetOtpController = async (req: Request, res: Response) => {
  const result = await requestPasswordResetOtp(req.body);
  res.status(200).json(result);
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const result = await resetPassword(req.body);
  res.status(200).json(result);
};

export const getCurrentUserController = async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);
  res.status(200).json(user);
};
