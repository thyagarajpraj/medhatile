# Implementation Steps

1. Environment setup
- Run `npm run setup` from repo root.
- Create local env files from examples for frontend and backend.

2. Backend readiness
- Start backend: `npm run dev:backend`.
- Confirm:
  - `GET /health`
  - `GET /api/health`
  - `GET /api/game/levels`
  - `GET /api/game/config`
  - `GET /api/game/pattern?gridSize=<int>&count=<int>`
  - `POST /api/game/submit`
  - `GET /api/movies`
  - `POST /api/movies`
  - `PUT /api/movies/:id`
  - `DELETE /api/movies/:id`

3. Frontend readiness
- Start frontend: `npm run dev:frontend`.
- Verify app boot and API base URL (`VITE_API_BASE_URL`).
- Verify navigation routes:
  - `/` loads game UI.
  - `/movies` loads movies UI.

4. Game engine behavior
- Ensure phase flow: `idle -> reveal -> recall -> review`.
- Reveal duration must be exactly 3000ms.
- Mistake limit must remain 3.
- On round success, increment score and start next level in same selected mode.

5. Feedback and review
- Track wrong selections separately.
- In review phase, show markers:
  - `OK` clicked correct
  - `.` missed correct
  - `X` wrong click
- After 3 mistakes, blink answer tiles for 1000ms and restart the same round automatically.

6. Persistence
- Read/write best score using `medhatile_best_score`.

7. Code documentation
- Add JSDoc comments for all declared functions in `frontend/src` and `backend/src`.

8. Validation
- Frontend tests: `cd frontend && npm run test`
- Frontend build: `cd frontend && npm run build`
- Backend build: `cd backend && npm run build`

9. GitHub CI
- Push branch and open PR.
- Confirm `.github/workflows/ci.yml` passes:
  - Frontend test/build
  - Backend build
