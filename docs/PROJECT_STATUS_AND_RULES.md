# Project Status And Rules

Last updated: June 11, 2026

## Purpose

This document is the quick reference for where MedhaTile currently stands and which rules agents should follow before changing the app.

## Current Application Status

| Area | Status | Notes |
|---|---|---|
| Web app | Buildable | Next.js App Router app with auth gate, choose-game route, 2048, identifying tiles, and leaderboard. |
| Backend API | Buildable | Express/TypeScript API with auth, health, game, score sync, leaderboard, and movies routes. Kept separate from web; may migrate to Next.js API routes in future. |
| Shared packages | Active | Web and mobile reuse shared API, game logic, and types from `shared/`. |
| Mobile app | Typechecked | React Native CLI app has auth, choose-game, 2048, and leaderboard screens. |
| Mobile identifying tiles | In Progress | Being implemented during web Next.js migration for feature parity. |
| Local build gate | Passing | `npm run build` passed on June 11, 2026. |
| Local runtime smoke check | Passing | Web and backend started locally; `/health`, `/api/health`, and web root returned HTTP 200 on June 11, 2026. |
| Backend startup warnings | Clean | Duplicate `User.email` index warning was removed; fresh backend stderr was empty on June 11, 2026. |
| Production backend deployment | Pending | Deployment target is Render or equivalent. |
| Production web deployment | Pending | Deployment target is Vercel or equivalent. |
| Production end-to-end validation | Pending | Requires deployed backend/frontend plus smoke testing. |
| Android Play Store release | Pending | Release signing, Play Console setup, policy forms, and device testing remain. |

## Verification Status

Verified on June 11, 2026:
- `npm run build`
- local web dev server returned HTTP 200 at `http://localhost:3000/`
- local backend returned HTTP 200 for `GET /health`
- local backend returned HTTP 200 for `GET /api/health`
- fresh backend startup log had no duplicate `User.email` index warning after cleanup

The root build includes:
- `corepack pnpm --filter web build`
- `corepack pnpm --filter backend build`
- `corepack pnpm --filter mobile typecheck`

Not verified in the latest pass:
- `npm run lint`
- `npm run test`
- `npm run coverage`
- `npm run precommit`
- live backend API smoke checks
- full authenticated API flow checks
- real device mobile testing
- production deployment validation

## Source Of Truth Order

Use these files in this order when requirements conflict:

1. `docs/PRODUCT_SPEC.md` for product behavior and UX intent.
2. `docs/API_CONTRACT.md` for backend response shapes, validation, and protected route behavior.
3. `docs/QA_CHECKLIST.md` for acceptance criteria.
4. `docs/IMPLEMENTATION_STEPS.md` for delivery order.
5. `docs/DEPLOYMENT_STATUS.md` for deployment readiness.
6. `docs/MOBILE_PLAYSTORE_RELEASE.md` for Android release readiness.

If implementation and docs disagree, do not guess silently. Update the stale doc or flag the mismatch before handoff.

## Current In-Scope Features

These are already part of the approved application surface:
- email/password auth
- session restore and sign out
- choose-game route
- 2048 game
- identifying-tiles web route
- leaderboard
- score submit and best-score sync
- shared API/game/type packages
- MongoDB-backed backend persistence
- Movies CRUD routes and local development support where already present
- React Native mobile shell with auth, choose-game, 2048, and leaderboard

## Scope Rules

Do not add speculative features. The following remain out of scope unless explicitly approved:
- payments
- ads
- AI features
- streaks
- social feeds
- public profiles
- subscriptions
- new game modes beyond the documented routes
- new persistent data domains beyond the documented API
- difficulty progression changes
- game phase model changes

Keep the API contract stable unless the user explicitly approves a contract change.

## Route And API Rules

- Protected web routes are `/`, `/games/adding`, `/games/identifying`, and `/leaderboard`.
- `/login` is the unauthenticated auth route.
- Do not document or validate a web route that is not mounted in the active `web/src` app.
- All non-health backend APIs must require a bearer token.
- Health routes must stay public: `GET /health` and `GET /api/health`.
- Movies CRUD is currently a backend/API capability. Do not describe it as an active web route unless a current web implementation exists.
- Pattern generation must return unique tile indexes and preserve `gridSize`/`count` validation from `docs/API_CONTRACT.md`.
- Best-score sync must use the higher local/account value and keep `medhatile_best_score` compatibility.

## Change Discipline

- Keep changes small and milestone-based.
- Prefer existing folder structure and naming conventions.
- Keep frontend, backend, mobile, and shared modules modular.
- Do not add dependencies unless required for the current milestone.
- Do not make hidden refactors outside touched modules.
- Update docs when behavior, setup, deployment, or release status changes.
- Keep the UI minimal, mobile responsive, and aligned with `docs/PRODUCT_SPEC.md`.
- Prefer ASCII punctuation and plain text in source and docs unless the file already intentionally uses another encoding.

## Environment And Secret Rules

- Do not commit `.env` files, database credentials, JWT secrets, keystores, signing passwords, or Play Console secrets.
- Keep backend secrets in `backend/.env` locally or hosting-provider environment settings.
- Production web deployments must set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend host (e.g. `https://medhatile.onrender.com`).
- Do not assume the fallback backend URL is production-ready until deployment health checks pass.
- Render or equivalent hosting should provide `PORT`; do not hardcode it.
- CORS must include the actual deployed frontend origin before production validation is marked done.

## Git And Release Rules

- Do not rewrite history, reset, or discard local changes unless explicitly requested.
- Keep documentation changes in the same PR as behavior changes when the behavior changes.
- Before Android release upload, increment `versionCode`, verify `versionName`, configure release signing, and build a signed `.aab`.
- Play Store readiness cannot be marked done until privacy policy, Data safety, content rating, store listing assets, and real-device testing are complete.
- Production readiness cannot be marked done until backend health, auth, game flow, score save, leaderboard, and protected API smoke checks pass against deployed URLs.

## Required Quality Gate

Before handoff for implementation work:
- run `npm run build` from the repo root
- confirm there are no TypeScript errors
- confirm affected backend endpoints still follow `docs/API_CONTRACT.md`
- state any checks that were not run

Before release or merge readiness:
- run `npm run lint`
- run `npm run test`
- run `npm run coverage`
- run `npm run precommit`
- complete relevant QA checklist items
- document any residual risks

For documentation-only changes:
- run `npm run build` if status, process, or release docs claim build readiness
- otherwise state why build was not needed
- verify links point to active docs or active source files

## Reviewer Rules

Reviewer output must:
- list findings first, ordered by severity
- include file path and concrete impact for every finding
- prioritize defects, regressions, and missing requirements over style preferences
- call out missing tests or unverified behavior
- avoid approving if any required checklist item is unverified

If there are no findings, the reviewer should say that clearly and still list residual risks or untested paths.

## Documentation Map

- `README.md`: project overview, setup, scripts, deployment entry points.
- `AGENTS.md`: builder/reviewer workflow and agent operating rules.
- `docs/PRODUCT_SPEC.md`: product behavior, game flow, UX criteria.
- `docs/API_CONTRACT.md`: backend endpoints and response contracts.
- `docs/QA_CHECKLIST.md`: functional, API, build, documentation, and UX checks.
- `docs/IMPLEMENTATION_STEPS.md`: recommended delivery sequence.
- `docs/DEPLOYMENT_STATUS.md`: local and production deployment status.
- `docs/MOBILE_PLAYSTORE_RELEASE.md`: Android release and Play Store checklist.
