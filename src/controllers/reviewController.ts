import { Request, Response } from "express";
import mongoose from "mongoose";
import Game from "../models/Game";
import Review from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { isValidId } from "../utils/isValidId";
import { AuthRequest } from "../middleware/authMiddleware";

const NOT_DELETED = { $ne: true };

const pickReviewFields = (body: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.comment !== undefined) data.comment = body.comment;
  return data;
};

export const getGameReviews = asyncHandler(async (req: Request, res: Response) => {
  const { gameId } = req.params;
  if (!isValidId(gameId)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const game = await Game.findOne({ _id: gameId, isDeleted: NOT_DELETED });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 10, 1), 50);

  const total = await Review.countDocuments({ game: gameId, isDeleted: NOT_DELETED });
  const reviews = await Review.find({ game: gameId, isDeleted: NOT_DELETED })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const stats = await Review.aggregate([
    { $match: { game: new mongoose.Types.ObjectId(gameId), isDeleted: NOT_DELETED } },
    { $group: { _id: null, average: { $avg: "$rating" } } },
  ]);
  const averageRating = stats.length > 0 ? Math.round(stats[0].average * 10) / 10 : 0;

  res.status(200).json({
    success: true,
    data: { reviews, total, page, pages: Math.ceil(total / limit), averageRating },
  });
});

export const createReview = asyncHandler<AuthRequest>(async (req, res) => {
  const { gameId } = req.params;
  if (!isValidId(gameId)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const game = await Game.findOne({ _id: gameId, isDeleted: NOT_DELETED });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const userId = req.user!._id;
  const fields = pickReviewFields(req.body);

  const existing = await Review.findOne({ user: userId, game: game._id });

  if (existing && !existing.isDeleted) {
    res.status(409);
    throw new Error("You have already reviewed this game. Edit your review instead.");
  }

  let review;
  if (existing) {
    existing.set({ rating: fields.rating, comment: fields.comment ?? "" });
    existing.isDeleted = false;
    existing.deletedAt = undefined;
    await existing.save();
    review = existing;
  } else {
    review = await Review.create({ user: userId, game: game._id, ...fields });
  }
  await review.populate("user", "name");

  res.status(201).json({ success: true, message: "Review added", data: { review } });
});

export const getMyReviews = asyncHandler<AuthRequest>(async (req, res) => {
  const reviews = await Review.find({ user: req.user!._id, isDeleted: NOT_DELETED })
    .populate({
      path: "game",
      select: "title genre platform coverImage",
      match: { isDeleted: NOT_DELETED }, 
    })
    .sort({ createdAt: -1 });

  const visible = reviews.filter((r) => r.game != null);

  res.status(200).json({ success: true, data: { reviews: visible } });
});

export const updateReview = asyncHandler<AuthRequest>(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid review id");
  }

  const review = await Review.findOne({ _id: req.params.id, isDeleted: NOT_DELETED });
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.user.toString() !== req.user!.id) {
    res.status(403);
    throw new Error("You can only edit your own review");
  }

  const data = pickReviewFields(req.body);
  if (Object.keys(data).length === 0) {
    res.status(400);
    throw new Error("No valid fields to update");
  }

  review.set(data);
  await review.save();
  await review.populate("user", "name");

  res.status(200).json({ success: true, message: "Review updated", data: { review } });
});

export const deleteReview = asyncHandler<AuthRequest>(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid review id");
  }

  const review = await Review.findOne({ _id: req.params.id, isDeleted: NOT_DELETED });
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const isOwner = review.user.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("You can only delete your own review");
  }

  review.isDeleted = true;
  review.deletedAt = new Date();
  await review.save();

  res.status(200).json({ success: true, message: "Review deleted" });
});
