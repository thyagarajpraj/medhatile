import { Router } from "express";
import { requireDatabase } from "../middleware/requireDatabase";
import { requireAuth } from "../features/auth/middleware/requireAuth";
import { getGameConfig, getLevels, getPattern, submitScore, syncBestScore } from "../controllers/game.controller";

const router = Router();

router.use(requireAuth);

router.get("/config", getGameConfig);
router.get("/levels", getLevels);
router.get("/pattern", getPattern);
router.post("/submit", requireDatabase, submitScore);
router.post("/best-score/sync", requireDatabase, syncBestScore);

export default router;
