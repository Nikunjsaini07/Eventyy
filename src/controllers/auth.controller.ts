import { Request, Response } from "express";

import { getCurrentUser, requestOtp, verifyOtp } from "../services/auth.service";

export const requestOtpController = async (req: Request, res: Response) => {
  const result = await requestOtp(req.body);
  res.status(200).json(result);
};

export const verifyOtpController = async (req: Request, res: Response) => {
  const result = await verifyOtp(req.body);
  res.status(200).json(result);
};

export const getCurrentUserController = async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);
  res.status(200).json(user);
};

