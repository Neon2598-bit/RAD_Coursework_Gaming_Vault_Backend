import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();


app.use(cors({ origin: env.CLIENT_URL })); 
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "GameVault API is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
