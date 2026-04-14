import { Request, Response } from "express";

import { getSiteContent } from "../services/site.service";

export const getPublicSiteContentController = async (_req: Request, res: Response) => {
  const content = await getSiteContent();
  res.status(200).json(content);
};
