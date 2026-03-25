import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "./app";

let server: ReturnType<typeof app.listen> | null = null;
let baseUrl = "";

/**
 * Starts the Express app on an ephemeral port for integration testing.
 */
before(() => {
  server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address !== "string", "Test server failed to start");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

/**
 * Closes the integration test server after the suite finishes.
 */
after(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

/**
 * Verifies the plain-text health endpoint stays publicly reachable.
 */
test("GET /health returns OK", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "OK");
});

/**
 * Verifies the JSON health endpoint stays publicly reachable.
 */
test("GET /api/health returns ok status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

/**
 * Verifies protected routes reject requests without a bearer token.
 */
test("protected app APIs require authentication", async () => {
  const gameResponse = await fetch(`${baseUrl}/api/game/config`);
  assert.equal(gameResponse.status, 401);
  assert.deepEqual(await gameResponse.json(), { error: "Authentication required" });

  const moviesResponse = await fetch(`${baseUrl}/api/movies`);
  assert.equal(moviesResponse.status, 401);
  assert.deepEqual(await moviesResponse.json(), { error: "Authentication required" });
});
