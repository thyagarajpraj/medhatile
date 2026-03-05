import { Router } from "express";
import { getGameConfig, getLevels, getPattern, submitScore } from "../controllers/game.controller";

const router = Router();

router.get("/config", getGameConfig);
router.get("/levels", getLevels);
router.get("/pattern", getPattern);
router.post("/submit", submitScore);

export default router;
