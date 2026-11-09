import { PipelineStage } from "mongoose";
import Game from "../models/Game";
import Review from "../models/Review";
import BacklogItem, { STATUSES, BacklogStatus } from "../models/BacklogItem";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";

// Reusable pipeline stages: join each item with its game and drop items whose game was
// soft-deleted, so the dashboard numbers always match what the user sees in their lists.
//   $lookup = SQL JOIN,  $unwind = turn the 1-item joined array into a plain object,
//   $match  = SQL WHERE
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

// GET /api/dashboard   (logged-in users) -> statistics about MY games and reviews
export const getDashboard = asyncHandler<AuthRequest>(async (req, res) => {
  // req.user comes from a Mongoose document, so _id is already an ObjectId (aggregate needs that)
  const userId = req.user!._id;

  // Three independent queries: run them at the same time with Promise.all
  const [statusRows, genreRows, reviewRows] = await Promise.all([
    // 1) how many games per status        (SQL: GROUP BY status)
    BacklogItem.aggregate<{ _id: BacklogStatus; count: number }>([
      { $match: { user: userId } },
      ...onlyActiveGames(),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // 2) my top genres                    (SQL: GROUP BY genre ORDER BY count DESC LIMIT 5)
    BacklogItem.aggregate<{ genre: string; count: number }>([
      { $match: { user: userId } },
      ...onlyActiveGames(),
      { $group: { _id: "$gameDoc.genre", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }, // most games first, then A-Z for ties
      { $limit: 5 },
      { $project: { _id: 0, genre: "$_id", count: 1 } }, // rename _id -> genre
    ]),

    // 3) how many reviews I wrote and my average rating   (SQL: COUNT(*), AVG(rating))
    Review.aggregate<{ count: number; average: number }>([
      { $match: { user: userId } },
      ...onlyActiveGames(),
      { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
    ]),
  ]);

  // Turn the rows into a friendly object. Statuses with no games must show 0, not be missing.
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
