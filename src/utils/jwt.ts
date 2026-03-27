import jwt, { SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;
