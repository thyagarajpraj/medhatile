# Implementation Steps

1. Environment setup
- Run `npm run setup` from repo root.
- If Husky hooks need to be recreated locally, run `npx husky init`.
- Create local env files from examples for frontend and backend.

2. Backend readiness
- Start backend: `npm run dev:backend`.
- Confirm:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /health`
  - `GET /api/health`
  - `GET /api/game/levels`
  - `GET /api/game/config`
  - `GET /api/game/pattern?gridSize=<int>&count=<int>`
  - `POST /api/game/submit`
  - `POST /api/game/best-score/sync`
  - `GET /api/movies`
  - `POST /api/movies`
  - `PUT /api/movies/:id`
  - `DELETE /api/movies/:id`

3. Frontend readiness
- Start frontend: `npm run dev:frontend`.
- Verify app boot and API base URL (`VITE_API_BASE_URL`).
- Verify the auth gate appears before the app shell and register includes `Confirm Password`.
- Verify navigation routes:
  - `/` loads choose-game UI after sign-in.
  - `/games/adding` loads the 2048 game after sign-in.
  - `/games/identifying` loads the memory game after sign-in.
  - `/leaderboard` loads the leaderboard after sign-in.
  - the top-right game dropdown switches between the available game routes.

4. Mobile foundation readiness
- Confirm the mobile app restores AsyncStorage sessions only after validating `GET /api/auth/me`.
- Confirm the mobile auth gate includes `Confirm Password` for register.
- Confirm authenticated mobile users land on the choose-game screen before opening `2048`.
- Confirm mobile leaderboard loading still works after the screen split.

5. Game engine behavior
- Ensure phase flow: `idle -> reveal -> recall -> review`.
- Reveal duration must be exactly 1000ms.
- Mistake limit must remain 3.
- On round success, increment score and start next level in same selected mode.

6. Feedback and review
- Track wrong selections separately.
- In review phase, show markers:
  - `OK` clicked correct
  - `.` missed correct
  - `X` wrong click
- After 3 mistakes, blink answer tiles for 1000ms and restart the same round automatically.

7. Persistence
- Read/write best score using `medhatile_best_score`.

8. Code documentation
- Add JSDoc comments for all declared functions in `web/src` and `backend/src`.
 
9. Validation
- Lint: `npm run lint`
- Web tests: `cd web && npm run test`
- Web coverage: `cd web && npm run coverage`
- Web build: `cd web && npm run build`
- Backend build: `cd backend && npm run build`
- Full pre-commit flow: `npm run precommit`

10. GitHub CI
- Push branch and open PR.
- Confirm `.github/workflows/ci.yml` passes:
  - Web test/build
  - Backend build
