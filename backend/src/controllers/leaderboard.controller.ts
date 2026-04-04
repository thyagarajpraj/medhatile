import { type Request, type Response } from "express";
import { User } from "../features/auth/models/user.model";

/**
 * Returns the top user scores in descending best-score order.
 */
export async function getLeaderboard(_req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find({})
      .sort({ bestScore: -1, email: 1 })
      .limit(20)
      .select("_id email bestScore createdAt")
      .lean();

    res.status(200).json({
      entries: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        score: user.bestScore ?? 0,
        mode: "classic",
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard", details: String(error) });
  }
}
