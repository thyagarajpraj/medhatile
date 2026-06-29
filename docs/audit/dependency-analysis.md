# Dependency Analysis

**Audited:** 2026-06-29

## Web (`web/package.json`)

| Package | Version | Role | Notes |
|---|---|---|---|
| next | ^16.2.9 | Framework | Next.js App Router |
| react | ^19.2.4 | UI | React 19 (stable) |
| react-dom | ^19.2.3 | UI | — |
| @tanstack/react-query | ^5.90.21 | Data fetching | Server state management |
| axios | ^1.8.4 | HTTP | Shared API client |
| @medhatile/shared-api | workspace:* | Internal | API calls |
| @medhatile/shared-game | workspace:* | Internal | 2048 logic |
| @medhatile/shared-types | workspace:* | Internal | Shared types |
| tailwindcss | ^4.3.1 | Styling | v4 (PostCSS plugin) |
| vitest | ^4.0.18 | Testing | Unit tests |
| @testing-library/react | ^16.3.2 | Testing | Component tests |
| typescript | ~5.9.3 | Tooling | Pinned minor |

**Observations:**
- React 19 + Next.js 16 is the latest stable stack. No issues.
- Tailwind v4 changes the PostCSS integration significantly from v3. Config is in `postcss.config.mjs`, not `tailwind.config.js` — correct for v4.
- `axios` is used as the HTTP layer for the shared API client. Reasonable choice.
- No animation library (needed for Phase 5+ game polish).
- No form library — auth forms are hand-rolled.
- No icon library — no icons visible in codebase.

---

## Mobile (`mobile/package.json`)

| Package | Version | Role | Notes |
|---|---|---|---|
| react-native | ^0.78.0 | Framework | CLI (not Expo) |
| react | 19.0.0 | UI | Pinned exact — differs from web (^19.2.4) |
| @react-native-async-storage/async-storage | ^2.1.2 | Storage | Session token |
| @babel/runtime | ^7.26.10 | Runtime | Required by RN |
| axios | ^1.8.4 | HTTP | Same version as web ✓ |
| @medhatile/shared-api | workspace:* | Internal | — |
| @medhatile/shared-game | workspace:* | Internal | — |
| @medhatile/shared-types | workspace:* | Internal | — |

**Observations:**
- `react` version pinned at `19.0.0` in mobile vs `^19.2.4` in web. A minor divergence — should align to `^19.0.0` or match exactly.
- No navigation library listed (`react-navigation` or equivalent) — mobile navigation may be custom or not yet implemented beyond the choose-game screen.
- No test framework in mobile at all.
- No gesture handler listed (`react-native-gesture-handler`) — 2048 uses gestures per commit history. This may be bundled with RN 0.78 or declared elsewhere.

---

## Backend (`backend/package.json`)

| Package | Version | Role | Notes |
|---|---|---|---|
| express | ^5.2.1 | Framework | Express 5 (stable since 2024) |
| mongoose | ^9.2.3 | ORM | MongoDB ODM |
| mongodb | ^7.1.1 | Driver | Native driver (also in root) |
| cors | ^2.8.6 | Middleware | CORS handling |
| dotenv | ^17.3.1 | Config | Env file loading |
| ts-node-dev | ^2.0.0 | Dev tooling | Dev server with watch |
| typescript | ^5.9.3 | Tooling | — |

**Observations:**
- Express 5 is the correct choice — async error handling is built in, route params typed.
- `mongoose` and `mongodb` both present — only one should be the primary DB interface. See TD-07.
- No input validation library (zod, joi, express-validator). Validation is hand-rolled in controllers.
- No rate limiting (express-rate-limit or similar).
- No request logging middleware (morgan, pino-http).
- `ts-node-dev` works but is slower than `tsx` or `ts-node` with SWC. Minor.
- `dotenv` v17 — latest major. Fine.

---

## Root (`package.json`)

| Package | Version | Role | Notes |
|---|---|---|---|
| mongodb | ^7.1.0 | ??? | Should NOT be here |
| eslint | ^10.2.0 | Linting | — |
| @eslint/js | ^10.0.1 | Linting | — |
| typescript-eslint | ^8.58.0 | Linting | — |
| globals | ^17.4.0 | Linting | — |
| husky | ^9.1.7 | Git hooks | — |
| lint-staged | ^16.4.0 | Pre-commit | — |
| @vitest/coverage-v8 | ^4.1.2 | Testing | Coverage reporter |

**Issues:**
- `mongodb: ^7.1.0` at root has no legitimate purpose here. Remove.
- `@vitest/coverage-v8` at root but vitest itself is only in `web/`. Coverage should be a dev dependency of `web/`.

---

## Dependency Duplication Matrix

| Package | root | web | mobile | backend |
|---|---|---|---|---|
| mongodb | 7.1.0 | — | — | 7.1.1 |
| typescript | — | ~5.9.3 | ^5.9.3 | ^5.9.3 |
| axios | — | 1.8.4 | 1.8.4 | — |
| react | — | ^19.2.4 | 19.0.0 (pinned) | — |

**Observations:**
- `mongodb` is declared twice with slightly different versions (`^7.1.0` vs `^7.1.1`). Remove from root.
- TypeScript versions are consistent across packages (good).
- React version pinned differently between web and mobile (minor risk).

---

## Missing Dependencies (needed for roadmap)

| Package | Needed for | Phase |
|---|---|---|
| prettier | Code formatting | 8 |
| @prettier/plugin-tailwindcss | Tailwind class sorting | 8 |
| react-native-gesture-handler | Mobile swipe gestures | — |
| react-navigation | Mobile navigation | — |
| framer-motion | Web animations | 5 |
| zod | Runtime validation | 4 |
| vitest (backend) | Backend unit tests | 9 |
| @playwright/test | E2E testing | 9 |
| turbo | Monorepo build cache | 3 |

---

## Security Observations

- No `npm audit` / `pnpm audit` results available (no node_modules in this audit).
- All major dependencies are on recent versions — low risk of known CVEs.
- `dotenv` v17 recent. Express 5 recent. Mongoose 9 recent.
- No `@types/bcrypt` or bcrypt direct dependency visible in backend — password hashing is abstracted in `lib/password.ts` (implementation not audited but function names suggest bcrypt usage).
