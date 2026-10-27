import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import User, { IUser } from "../models/User";
import Review from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { signAccessToken, signRefreshToken } from "../utils/generateTokens";
import { AuthRequest } from "../middleware/authMiddleware";

const publicUser = (user: IUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error(
      exists.isDeleted
        ? "This email belongs to a deactivated account. Log in to reactivate it."
        : "Email is already registered"
    );
  }

  const user = await User.create({ name, email, password });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: { user: publicUser(user), accessToken, refreshToken },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  let message = "Logged in successfully";
  if (user.isDeleted) {
    await Review.updateMany(
      { user: user._id, isDeleted: true, deletedAt: user.deletedAt },
      { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }
    );
    user.isDeleted = false;
    user.deletedAt = undefined;
    message = "Welcome back! Your account has been reactivated.";
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(200).json({
    success: true,
    message,
    data: { user: publicUser(user), accessToken, refreshToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!isNonEmptyString(refreshToken)) {
    res.status(400);
    throw new Error("Refresh token is required");
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401);
    throw new Error("Refresh token invalid or expired, please log in again");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.isDeleted || user.refreshToken !== refreshToken) {
    res.status(401);
    throw new Error("Refresh token is not valid, please log in again");
  }

  const accessToken = signAccessToken(user.id, user.role);
  res.status(200).json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler<AuthRequest>(async (req, res) => {
  await User.findByIdAndUpdate(req.user!._id, { $unset: { refreshToken: 1 } });
  res.status(200).json({ success: true, message: "Logged out" });
});

export const getMe = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json({ success: true, data: { user: publicUser(req.user!) } });
});

export const deleteMe = asyncHandler<AuthRequest>(async (req, res) => {
  const userId = req.user!._id;
  const now = new Date();

  await User.findByIdAndUpdate(userId, {
    $set: { isDeleted: true, deletedAt: now },
    $unset: { refreshToken: 1 },
  });
  await Review.updateMany(
    { user: userId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now } }
  );

  res.status(200).json({
    success: true,
    message: "Account deactivated. Log in again at any time to reactivate it.",
  });
});
