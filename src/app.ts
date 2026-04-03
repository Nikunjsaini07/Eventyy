import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import router from "./routes";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);
