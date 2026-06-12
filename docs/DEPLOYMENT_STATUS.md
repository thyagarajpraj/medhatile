# Deployment Status

Last updated: June 11, 2026

## Current Environment Status

| Component | Current target | Status |
|---|---|---|
| Frontend | Local Next.js dev server: `http://localhost:3000` | Active (local) |
| Backend | Local Node/Express server: `http://127.0.0.1:5000` | Active (local) |
| API base used by web/shared API | `http://127.0.0.1:5000/api` | Active (local) |
| Database | MongoDB Atlas cluster (`sample_mflix.movies` used for Movies CRUD) | Connected in local backend |

Notes:
- No production cloud deployment has been finalized yet.
- Secrets should stay only in local `backend/.env` or hosting platform env settings, never in docs.
- Current status and scope rules are summarized in `docs/PROJECT_STATUS_AND_RULES.md`.
- Local smoke check on June 11, 2026 confirmed web root, `/health`, and `/api/health` return HTTP 200.
- Fresh backend startup on June 11, 2026 had no duplicate `User.email` index warning after cleanup.

## Deployment Plan

1. Stabilize repository state
- Resolve merge conflict markers in source and config files.
- Confirm root `npm run build` passes.

2. Deploy backend
- Target: Render Web Service (or equivalent).
- Preferred config source: repo-level `render.yaml`.
- Required env: `FRONTEND_ORIGIN`, `MONGO_URI`, `JWT_SECRET`, optional debug flags.
- Runtime note: Render should supply `PORT`; do not hardcode it in the dashboard.
- Health checks: `/health`, `/api/health`, `/api/game/*`, `/api/movies*`.

3. Deploy frontend
- Target: Vercel (or equivalent).
- Required env: `NEXT_PUBLIC_API_BASE_URL=<deployed-backend>` (host only; shared API client adds `/api/...` paths).
- Validate `/`, `/games/adding`, `/games/identifying`, and `/leaderboard` route behavior.

4. Post-deploy validation
- Confirm CORS between frontend and backend.
- Run Movies CRUD API smoke checks if backend CRUD remains in release scope.
- Run game flow checks from QA checklist.

## Plan Status Snapshot

| Item | Status |
|---|---|
| Local frontend/backend/db integration | Done |
| Env-based API configuration | Done |
| Mobile gameplay info panel below tiles | Done |
| Movies CRUD backend API | Done locally |
| Root build (`npm run build`) | Done |
| Production backend deployment | Pending |
| Production frontend deployment | Pending |
| End-to-end production validation | Pending |
| Android Play Store release readiness | Pending |

## Known Blockers

- No repository-level blockers at this time.
- Remaining work is deployment and production verification.
- Android release still needs signing, Play Console setup, policy forms, and real-device testing before Play Store upload.
