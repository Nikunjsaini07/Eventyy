import { Router } from "express";

import { getPublicSiteContentController } from "../controllers/site.controller";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/", asyncHandler(getPublicSiteContentController));

export default router;
