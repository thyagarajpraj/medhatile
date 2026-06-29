# Strengths Audit

**Audited:** 2026-06-29

## 1. Feature-Based Folder Structure

All three apps (web, mobile, backend) use the same convention:

```
src/features/<feature-name>/
```

This means any engineer can locate all code for `auth`, `identifying`, or `leaderboard` in one place across every app. Promotes team scalability and onboarding speed.

## 2. Shared Package Architecture Already Working

`@medhatile/shared-types`, `@medhatile/shared-game`, and `@medhatile/shared-api` are real pnpm workspace packages consumed by both `web` and `mobile`. This is the correct foundation for a cross-platform monorepo. The dependency graph is clean — `types` has no deps, `game` and `api` depend only on `types`.

## 3. Pure Game Logic Functions

`shared/game/logic.ts` is entirely pure functions with no side effects:

```ts
createBoard, spawnTile, mergeTiles, moveTiles,
calculateScore, checkGameOver, boardsAreEqual, createStartingBoard
```

These are trivially unit-testable, framework-agnostic, and can be used identically on web, mobile, and server. This is the right design for game engine code.

## 4. Strong Source-of-Truth Documentation Hierarchy

`docs/PROJECT_STATUS_AND_RULES.md` defines a clear precedence order:

1. `PRODUCT_SPEC.md` — product behavior
2. `API_CONTRACT.md` — endpoint contracts
3. `QA_CHECKLIST.md` — acceptance criteria
4. `IMPLEMENTATION_STEPS.md` — delivery order
5. `DEPLOYMENT_STATUS.md` — readiness

Having this hierarchy written down prevents agents and engineers from guessing when documents conflict.

## 5. API Contract Is Machine-Readable Enough to Test Against

`docs/API_CONTRACT.md` includes request/response shapes, validation rules, and HTTP status codes for every endpoint. This is close to a formal contract and is the basis for the QA checklist's API section.

## 6. Backend Auth Is Well-Implemented

`auth.controller.ts` shows:
- Email normalized to lowercase before comparison
- Password minimum length enforced before DB hit
- bcrypt hashing (via `hashPassword` / `verifyPassword`)
- JWT signing abstracted into `signAuthToken`
- Duplicate email check returns 409 before creating user
- `req.authUser` typed via Express module augmentation (`types/express.d.ts`)

This is production-quality auth for the current scope.

## 7. CORS Is Environment-Aware

`backend/src/app.ts` parses `FRONTEND_ORIGIN` from env, adds local dev origins in non-production, and allows multiple comma-separated origins. No wildcard `*` in production.

## 8. Precommit Gate Enforces Build + Tests + Coverage

`.husky/pre-commit` runs `npm run precommit` which chains lint-staged + tests + coverage + full build. Build cannot pass with broken TypeScript. This catches regressions before they reach the remote.

## 9. Two-Agent Workflow Documented

`AGENTS.md` defines Builder and Reviewer roles with explicit handoff criteria and quality gates. This is an unusually mature process discipline for a personal project.

## 10. Scope Rules Are Explicit and Enforced by Docs

`PROJECT_STATUS_AND_RULES.md` lists prohibited features (payments, ads, AI, streaks, social feeds) and requires explicit approval before adding anything not on the current surface. This prevents scope creep and keeps the project reviewable.

## 11. Mobile and Web Have Feature Parity Goals

Both apps implement: auth gate, choose-game, 2048, leaderboard. Identifying tiles is in progress on mobile. The intent to ship both platforms from the same repo with shared logic is architecturally sound.

## 12. Render Deployment Config Is Code

`render.yaml` at the repo root defines the backend service configuration declaratively. Deployment is reproducible and not dependent on manual dashboard settings.

## 13. ESLint Config Is Modern and Strict

`eslint.config.mjs` uses the flat config format with `typescript-eslint` strict rules. `--max-warnings=0` in the lint script means lint warnings are treated as errors. No legacy `.eslintrc` files.

## 14. Identifying Tiles Logic Is Well-Designed

`web/src/features/identifying/logic.ts` shows:
- `extendPattern` preserves prior correct tiles when increasing difficulty — a subtle and correct game design decision
- `generatePattern` uses a `Set` to guarantee uniqueness
- State machine with `Phase = "idle" | "reveal" | "recall" | "review"` is clean and testable

## 15. Backend Separates App from Server Entry

`backend/src/app.ts` exports the Express app without calling `listen`. `backend/src/server.ts` handles DB connection and `listen`. This makes the app testable in isolation without starting a real server.
