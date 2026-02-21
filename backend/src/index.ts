import cors from "cors";
import express, { type Request, type Response } from "express";
import { gameRoutes } from "./routes/gameRoutes";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.use("/api", gameRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`MedhaTile backend running on http://localhost:${port}`);
});
