import { Router } from "express";
import { register, login, refresh, logout, getMe, deleteMe } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.delete("/me", protect, deleteMe);

export default router;
