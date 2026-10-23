import jwt from "jsonwebtoken";
import { env } from "../config/env";

type Expires = jwt.SignOptions["expiresIn"];

export const signAccessToken = (id: string, role: string): string =>
  jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as Expires,
  });

export const signRefreshToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as Expires,
  });
