import { Router } from "express";
import { getCurrentUser, loginUser, registerUser } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

const authRoutes = Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.get("/me", requireAuth, getCurrentUser);

export default authRoutes;
