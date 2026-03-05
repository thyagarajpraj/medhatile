import { Router } from "express";
import { getHealth, getLevels, getPattern } from "../controllers/game.controller";

export const gameRoutes = Router();

gameRoutes.get("/health", getHealth);
gameRoutes.get("/levels", getLevels);
gameRoutes.get("/pattern", getPattern);
