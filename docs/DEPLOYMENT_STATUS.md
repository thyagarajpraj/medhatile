# Deployment Status

Last updated: March 5, 2026

## Current Environment Status

| Component | Current target | Status |
|---|---|---|
| Frontend | Local Vite dev server: `http://localhost:5173` | Active (local) |
| Backend | Local Node/Express server: `http://127.0.0.1:5000` | Active (local) |
| API base used by movies UI | `http://127.0.0.1:5000/api` | Active (local) |
| Database | MongoDB Atlas cluster (`sample_mflix.movies` used for Movies CRUD) | Connected in local backend |

Notes:
- No production cloud deployment has been finalized yet.
- Secrets should stay only in local `backend/.env` or hosting platform env settings, never in docs.

## Deployment Plan

1. Stabilize repository state
- Resolve merge conflict markers in source and config files.
- Confirm root `npm run build` passes.

2. Deploy backend
- Target: Render Web Service (or equivalent).
- Required env: `PORT`, `FRONTEND_ORIGIN`, `MONGO_URI`, optional debug flags.
- Health checks: `/health`, `/api/health`, `/api/game/*`, `/api/movies*`.

3. Deploy frontend
- Target: Vercel (or equivalent).
- Required env: `VITE_API_BASE_URL=<deployed-backend>/api`.
- Validate `/` and `/movies` route behavior.

4. Post-deploy validation
- Confirm CORS between frontend and backend.
- Run Movies CRUD smoke checks.
- Run game flow checks from QA checklist.

## Plan Status Snapshot

| Item | Status |
|---|---|
| Local frontend/backend/db integration | Done |
| Scroll pagination + virtualized list for Movies | Done |
| Debounced search in Movies | Done |
| React Query integration + query cache in Movies | Done |
| Production backend deployment | Pending |
| Production frontend deployment | Pending |
| End-to-end production validation | Pending |

## Known Blockers

- Unresolved merge conflict markers exist in multiple repository files.
- Because of that, full root build is currently blocked until conflicts are resolved.
