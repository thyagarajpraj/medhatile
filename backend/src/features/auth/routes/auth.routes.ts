import { Router } from "express";
import { requireDatabase } from "../../../middleware/requireDatabase";
import { getCurrentUser, loginUser, registerUser } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

const authRoutes = Router();

authRoutes.post("/register", requireDatabase, registerUser);
authRoutes.post("/login", requireDatabase, loginUser);
authRoutes.get("/me", requireAuth, requireDatabase, getCurrentUser);

export default authRoutes;
