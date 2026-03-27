import { Request, Response } from "express";

import { getMyProfile, submitUniversityDetails } from "../services/user.service";

export const getMyProfileController = async (req: Request, res: Response) => {
  const profile = await getMyProfile(req.user!.id);
  res.status(200).json(profile);
};

export const submitUniversityDetailsController = async (req: Request, res: Response) => {
  const profile = await submitUniversityDetails(req.user!.id, req.body);
  res.status(200).json(profile);
};

