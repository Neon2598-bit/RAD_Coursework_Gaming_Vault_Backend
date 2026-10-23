import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import User, { IUser } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface TokenPayload extends jwt.JwtPayload {
  id: string;
  role: string;
}

export const protect = asyncHandler<AuthRequest>(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = header.split(" ")[1];
  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error("Forbidden: you do not have permission"));
    }
    next();
  };
