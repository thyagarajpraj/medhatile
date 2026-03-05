# Implementation Steps

1. Environment setup
- Run `npm run setup` from repo root.
- Create local env files from examples for frontend and backend.

2. Backend readiness
- Start backend: `npm run dev:backend`.
- Confirm:
  - `GET /api/health`
  - `GET /api/levels`
  - `GET /api/pattern?gridSize=<int>&count=<int>`
  - `GET /api/movies`
  - `POST /api/movies`
  - `PUT /api/movies/:id`
  - `DELETE /api/movies/:id`

2.1 Backend module structure
- Keep movie API files grouped under `backend/src/features/movies/`:
  - `controllers/`
  - `models/`
  - `routes/`

3. Frontend readiness
- Start frontend: `npm run dev:frontend`.
- Verify app boot and API base URL (`VITE_API_BASE_URL`).
- Verify navigation routes:
  - `/` loads game UI.
  - `/movies` loads movies UI.
- Keep movies UI files grouped under `frontend/src/features/movies/`:
  - `components/`
  - `services/`
  - `types/`

4. Game engine behavior
- Ensure phase flow: `idle -> reveal -> recall -> review -> gameover`.
- Reveal duration must be exactly 3000ms.
- Mistake limit must remain 3.
- On round success, increment score and start next level in same selected mode.

5. Feedback and review
- Track wrong selections separately.
- In review phase, show markers:
  - `OK` clicked correct
  - `.` missed correct
  - `X` wrong click
- Require user action (`Next`) before game over modal.

6. Persistence
- Read/write best score using `medhatile_best_score`.

7. Validation
- Frontend tests: `cd frontend && npm run test`
- Frontend build: `cd frontend && npm run build`
- Backend build: `cd backend && npm run build`

8. GitHub CI
- Push branch and open PR.
- Confirm `.github/workflows/ci.yml` passes:
  - Frontend test/build
  - Backend build

