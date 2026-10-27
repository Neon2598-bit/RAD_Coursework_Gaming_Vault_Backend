import Game from "../models/Game";
import BacklogItem, { STATUSES, BacklogStatus } from "../models/BacklogItem";
import { asyncHandler } from "../utils/asyncHandler";
import { isValidId } from "../utils/isValidId";
import { AuthRequest } from "../middleware/authMiddleware";

const GAME_FIELDS = "title genre platform releaseYear coverImage";

const NOT_DELETED = { $ne: true };

export const getMyBacklog = asyncHandler<AuthRequest>(async (req, res) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = { user: req.user!._id, isDeleted: NOT_DELETED };
  if (status !== undefined && status !== "") {
    if (typeof status !== "string" || !STATUSES.includes(status as BacklogStatus)) {
      res.status(400);
      throw new Error("Status must be one of: " + STATUSES.join(", "));
    }
    filter.status = status;
  }

  const items = await BacklogItem.find(filter)
    .populate({ path: "game", select: GAME_FIELDS, match: { isDeleted: NOT_DELETED } })
    .sort({ updatedAt: -1 });
  const visible = items.filter((item) => item.game != null);

  res.status(200).json({ success: true, data: { items: visible } });
});

export const addToBacklog = asyncHandler<AuthRequest>(async (req, res) => {
  const { gameId, status } = req.body;

  if (typeof gameId !== "string" || !isValidId(gameId)) {
    res.status(400);
    throw new Error("A valid gameId is required");
  }

  const game = await Game.findOne({ _id: gameId, isDeleted: NOT_DELETED });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const userId = req.user!._id;

  const existing = await BacklogItem.findOne({ user: userId, game: game._id });
  if (existing && !existing.isDeleted) {
    res.status(409);
    throw new Error("This game is already in your backlog");
  }

  let item;
  if (existing) {
    existing.status = status ?? "wishlist";
    existing.isDeleted = false;
    existing.deletedAt = undefined;
    await existing.save();
    item = existing;
  } else {
    item = await BacklogItem.create({
      user: userId,
      game: game._id,
      ...(status !== undefined && { status }),
    });
  }
  await item.populate({ path: "game", select: GAME_FIELDS });

  res.status(201).json({ success: true, message: "Added to backlog", data: { item } });
});

export const updateBacklogItem = asyncHandler<AuthRequest>(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid backlog item id");
  }

  const { status } = req.body;
  if (status === undefined) {
    res.status(400);
    throw new Error("Status is required");
  }

  const item = await BacklogItem.findOne({
    _id: req.params.id,
    user: req.user!._id,
    isDeleted: NOT_DELETED,
  });
  if (!item) {
    res.status(404);
    throw new Error("Backlog item not found");
  }

  item.status = status;
  await item.save();
  await item.populate({ path: "game", select: GAME_FIELDS });

  res.status(200).json({ success: true, message: "Status updated", data: { item } });
});

export const removeFromBacklog = asyncHandler<AuthRequest>(async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid backlog item id");
  }

  const item = await BacklogItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id, isDeleted: NOT_DELETED },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );
  if (!item) {
    res.status(404);
    throw new Error("Backlog item not found");
  }

  res.status(200).json({ success: true, message: "Removed from backlog" });
});
