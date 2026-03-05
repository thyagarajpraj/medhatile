import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";

dotenv.config({ override: true });

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
      console.log(`HTTP debug logging: ${process.env.DEBUG_HTTP === "true" ? "ON" : "OFF"}`);
      console.log(`CORS frontend origin: ${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}`);
    });
  })
  .catch((error) => {
    console.error("Server bootstrap failed", error);
    process.exit(1);
  });
