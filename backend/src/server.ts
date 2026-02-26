import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

/**
 * Boots the HTTP server on configured port.
 */
function startServer(): void {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();