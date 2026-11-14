import { PipelineStage } from "mongoose";
import Game from "../models/Game";
import Review from "../models/Review";
import BacklogItem, { STATUSES, BacklogStatus } from "../models/BacklogItem";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";

const onlyActiveGames = (): PipelineStage[] => [
  {
    $lookup: {
      from: Game.collection.name, // "games"
      localField: "game",
      foreignField: "_id",
      as: "gameDoc",
    },
  },
  { $unwind: "$gameDoc" },
  { $match: { "gameDoc.isDeleted": { $ne: true } } },
];

export const getDashboard = asyncHandler<AuthRequest>(async (req, res) => {
  const userId = req.user!._id;

  const [statusRows, genreRows, reviewRows] = await Promise.all([
    BacklogItem.aggregate<{ _id: BacklogStatus; count: number }>([
      { $match: { user: userId, isDeleted: { $ne: true } } },
      ...onlyActiveGames(),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    BacklogItem.aggregate<{ genre: string; count: number }>([
      { $match: { user: userId, isDeleted: { $ne: true } } },
      ...onlyActiveGames(),
      { $group: { _id: "$gameDoc.genre", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 5 },
      { $project: { _id: 0, genre: "$_id", count: 1 } },
    ]),

    Review.aggregate<{ count: number; average: number }>([
      { $match: { user: userId, isDeleted: { $ne: true } } },
      ...onlyActiveGames(),
      { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
    ]),
  ]);

  const backlog: Record<string, number> = {};
  for (const status of STATUSES) backlog[status] = 0;
  for (const row of statusRows) backlog[row._id] = row.count;
  const total = Object.values(backlog).reduce((sum, n) => sum + n, 0);

  const reviews = reviewRows[0]
    ? { count: reviewRows[0].count, averageRating: Math.round(reviewRows[0].average * 10) / 10 }
    : { count: 0, averageRating: 0 };

  res.status(200).json({
    success: true,
    data: { backlog: { ...backlog, total }, reviews, topGenres: genreRows },
  });
});