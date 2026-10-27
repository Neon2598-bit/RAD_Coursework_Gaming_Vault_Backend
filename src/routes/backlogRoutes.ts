import { Router } from "express";
import {
  getMyBacklog,
  addToBacklog,
  updateBacklogItem,
  removeFromBacklog,
} from "../controllers/backlogController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getMyBacklog);
router.post("/", addToBacklog);
router.put("/:id", updateBacklogItem);
router.delete("/:id", removeFromBacklog);

export default router;
