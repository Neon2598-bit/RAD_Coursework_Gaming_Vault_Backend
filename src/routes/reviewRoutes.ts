import { Router } from "express";
import {
  getGameReviews,
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/games/:gameId/reviews", getGameReviews);
router.post("/games/:gameId/reviews", protect, createReview);

router.get("/reviews/my", protect, getMyReviews);
router.put("/reviews/:id", protect, updateReview);
router.delete("/reviews/:id", protect, deleteReview);

export default router;
