import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import gameRoutes from "./routes/gameRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import backlogRoutes from "./routes/backlogRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

const app = express();

app.use(cors({ origin: env.CLIENT_URLS }));
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "GameVault API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api", reviewRoutes);
app.use("/api/backlog", backlogRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;