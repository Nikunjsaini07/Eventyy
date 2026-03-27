import cors from "cors";
import express from "express";
import morgan from "morgan";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import router from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);

