import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller";
import { requireAuth } from "../features/auth/middleware/requireAuth";
import { requireDatabase } from "../middleware/requireDatabase";

const leaderboardRoutes = Router();

leaderboardRoutes.use(requireAuth);
leaderboardRoutes.use(requireDatabase);

leaderboardRoutes.get("/", getLeaderboard);

export default leaderboardRoutes;
