import { Request, Response } from "express";
import Game from "../models/Game";
import { asyncHandler } from "../utils/asyncHandler";
import { isValidId } from "../utils/isValidId";

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NOT_DELETED = { $ne: true };

const ALLOWED_FIELDS = ["title", "genre", "platform", "releaseYear", "description", "coverImage"] as const;

const pickGameFields = (body: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

export const getGames = asyncHandler(async (req: Request, res: Response) => {
  const { search, genre, platform } = req.query;
  const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 12, 1), 50);

  const filter: Record<string, unknown> = { isDeleted: NOT_DELETED };
  if (typeof search === "string" && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
  }
  if (typeof genre === "string" && genre) filter.genre = genre;
  if (typeof platform === "string" && platform) filter.platform = platform;

  const total = await Game.countDocuments(filter);
  const games = await Game.find(filter)
    .sort({ createdAt: -1 }) // newest first
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: { games, total, page, pages: Math.ceil(total / limit) },
  });
});

export const getDeletedGames = asyncHandler(async (req: Request, res: Response) => {
  const games = await Game.find({ isDeleted: true }).sort({ updatedAt: -1 });
  res.status(200).json({ success: true, data: { games } });
});

export const getGameById = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const game = await Game.findOne({ _id: req.params.id, isDeleted: NOT_DELETED });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.status(200).json({ success: true, data: { game } });
});

export const createGame = asyncHandler(async (req: Request, res: Response) => {
  const game = await Game.create(pickGameFields(req.body));
  res.status(201).json({ success: true, message: "Game created", data: { game } });
});

export const updateGame = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const data = pickGameFields(req.body);
  if (Object.keys(data).length === 0) {
    res.status(400);
    throw new Error("No valid fields to update");
  }

  const game = await Game.findOneAndUpdate({ _id: req.params.id, isDeleted: NOT_DELETED }, data, {
    new: true,
    runValidators: true,
  });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.status(200).json({ success: true, message: "Game updated", data: { game } });
});

export const deleteGame = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const game = await Game.findOneAndUpdate(
    { _id: req.params.id, isDeleted: NOT_DELETED },
    { isDeleted: true },
    { new: true }
  );
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.status(200).json({ success: true, message: "Game deleted" });
});

export const restoreGame = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid game id");
  }

  const game = await Game.findOneAndUpdate(
    { _id: req.params.id, isDeleted: true },
    { isDeleted: false },
    { new: true }
  );
  if (!game) {
    res.status(404);
    throw new Error("Deleted game not found");
  }

  res.status(200).json({ success: true, message: "Game restored", data: { game } });
});
