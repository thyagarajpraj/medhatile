import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const PORT = Number(process.env.PORT) || 5000;

/**
 * Connects dependencies and starts the HTTP server.
 */
async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
      console.log(`HTTP debug logging: ${process.env.DEBUG_HTTP === "true" ? "ON" : "OFF"}`);
      console.log(`CORS frontend origin: ${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}`);
    });
  } catch (error) {
    console.error("Server bootstrap failed", error);
    process.exit(1);
  }
}

void startServer();
