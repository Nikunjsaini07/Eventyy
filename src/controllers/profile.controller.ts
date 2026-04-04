import { Request, Response } from "express";

import {
  deleteMyAccount,
  getMyProfile,
  requestDeleteMyAccountOtp,
  submitUniversityDetails
} from "../services/user.service";

export const getMyProfileController = async (req: Request, res: Response) => {
  const profile = await getMyProfile(req.user!.id);
  res.status(200).json(profile);
};

export const submitUniversityDetailsController = async (req: Request, res: Response) => {
  const profile = await submitUniversityDetails(req.user!.id, req.body);
  res.status(200).json(profile);
};

export const deleteMyAccountController = async (req: Request, res: Response) => {
  const result = await deleteMyAccount(req.user!.id, req.body);
  res.status(200).json(result);
};

export const requestDeleteMyAccountOtpController = async (req: Request, res: Response) => {
  const result = await requestDeleteMyAccountOtp(req.user!.id);
  res.status(200).json(result);
};
