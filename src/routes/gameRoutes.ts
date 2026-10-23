import { Router } from "express";
import {
  getGames,
  getDeletedGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  restoreGame,
} from "../controllers/gameController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getGames);

router.get("/deleted", protect, authorize("admin"), getDeletedGames);

router.get("/:id", getGameById);

router.post("/", protect, authorize("admin"), createGame);
router.put("/:id/restore", protect, authorize("admin"), restoreGame);
router.put("/:id", protect, authorize("admin"), updateGame);
router.delete("/:id", protect, authorize("admin"), deleteGame);

export default router;
