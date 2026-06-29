# Technical Debt Audit

**Audited:** 2026-06-29

Technical debt is intentional or unintentional design shortcuts that make future work harder. Unlike weaknesses, these do not break anything today but will slow down Phase 3–15 of the evolution plan.

---

## TD-01: CI Is Completely Stale and Must Be Rewritten

**File:** `.github/workflows/ci.yml`

**Debt:** The workflow was written for the old Vite + npm setup. The project has moved to Next.js + pnpm but CI was never updated. The workflow:
- References `frontend/` (deleted)
- Uses `npm ci` (wrong package manager)
- Has no lint, coverage, or pnpm workspace awareness
- Has no mobile typecheck job
- Has no shared package validation

**Cost:** Every PR has broken CI. There is no automated protection on the main branch. As the monorepo grows with new packages and games, an unupdated CI becomes increasingly difficult to retrofit.

**Fix in Phase 3:** Rewrite the workflow to use `pnpm`, run per-workspace jobs, and cover lint + test + coverage + build for all packages.

---

## TD-02: Archives Directory Is Dead Weight in Active Repo

**Directory:** `archives/`

**Contents:**
- `archives/frontend/` — old Vite React app (pre-Next.js)
- `archives/apps/` — copy of the Vite app with a monorepo scaffold layout
- `archives/packages/` — stub packages from an earlier monorepo attempt

**Debt:** These directories are committed live code. They confuse new contributors about what is current, inflate clone size, add noise to `find` and `grep` searches, and create false positives in dependency scans. ESLint explicitly ignores `archives/` but it still pollutes the workspace.

**Cost:** Grows with each phase — when new games and packages are added, the archives become more confusing as a ghost of a different structure.

**Fix in Phase 3:** Move to a git tag (`archive/pre-nextjs-migration`) and delete from the working tree.

---

## TD-03: Shared Packages Have No Published Interface

**Location:** `shared/*/package.json`

**Debt:** All three shared packages (`shared-types`, `shared-game`, `shared-api`) point to raw `.ts` source as their `main` and `types`. They have no:
- `tsconfig.json` of their own
- `build` script
- `dist/` output
- Proper `exports` field

**Cost:** When a new consumer is added (e.g., `apps/admin/`, a game package, or a documentation generator), there is no stable compiled API to import. Each new consumer must configure TypeScript to resolve workspace TypeScript sources, which is non-standard and fragile.

**Fix in Phase 4:** Add `tsconfig.json`, a `build` script, and `exports` to each shared package. Generate declaration files.

---

## TD-04: Backend Duplicates Types From Shared

**Location:** `backend/src/types/game.ts`, `backend/src/lib/difficulty.ts`, `backend/src/lib/generatePattern.ts`

**Debt:** The backend independently defines and implements types and logic that overlap with the shared packages:
- `backend/src/types/game.ts` — game types not imported from `@medhatile/shared-types`
- `backend/src/lib/difficulty.ts` — difficulty config duplicated from `web/src/features/identifying/logic.ts`
- `backend/src/lib/generatePattern.ts` — pattern generation duplicated from shared game logic

**Cost:** Changes to difficulty levels or pattern generation must be made in two places. Risk of divergence is high (client and server generate patterns differently → round validation bugs).

**Fix in Phase 4:** Backend should consume `@medhatile/shared-types` and `@medhatile/shared-game`. Move difficulty and pattern logic into the shared game package.

---

## TD-05: No Prettier Configuration

**Observation:** The project has ESLint for linting but no Prettier for formatting. Formatting is only enforced at the ESLint level (which catches some style issues but not all whitespace/indentation).

**Cost:** Contributors use different editors with different default formatting. `git diff` noise from whitespace changes. Code review attention is spent on formatting rather than logic.

**Fix in Phase 8:** Add `prettier` with a `.prettierrc`, integrate with ESLint via `eslint-config-prettier`, add to lint-staged.

---

## TD-06: No Root `tsconfig.json`

**Observation:** Each workspace has its own `tsconfig.json`. There is no root-level TypeScript configuration to establish base compiler options shared across all packages.

**Cost:** Divergent TypeScript strictness settings across packages. When a new package is added, its TypeScript config is written from scratch and may accidentally be less strict. `tsconfig` paths for workspace packages are repeated in each consumer.

**Fix in Phase 3:** Add a root `tsconfig.base.json` with strict settings. Each package `extends` it and overrides only what differs.

---

## TD-07: Backend Uses Both `mongodb` and `mongoose`

**Location:** `backend/package.json`

```json
"dependencies": {
  "mongodb": "^7.1.1",
  "mongoose": "^9.2.3"
}
```

**Debt:** Mongoose wraps the native MongoDB driver. Having both installed suggests mixed usage patterns. The native driver may have been used for exploratory code (`__mongo_test.js` in the backend root) that was never removed.

**Cost:** Two MongoDB clients in memory. Potential for connection pool confusion. Maintenance burden of keeping two driver versions in sync.

**Fix:** Audit actual usage. If all DB access goes through Mongoose, remove the native `mongodb` driver dependency from the backend.

---

## TD-08: Backend Tests Compile Then Run `dist/`

**Location:** `backend/package.json`

```json
"test": "npm run build && node --test dist"
```

**Debt:** Tests require a full TypeScript compilation before running. This makes the test cycle slow and means tests run against compiled output, not source. If there is a bug in the TypeScript compiler configuration (e.g., excluded files), tests may not cover the intended code.

**Cost:** Slow feedback loop. Cannot use source maps correctly. No watch mode for TDD.

**Fix in Phase 9:** Switch backend tests to `ts-node` or `vitest` with TypeScript support to test source directly.

---

## TD-09: Pattern Generation Is Server-Side Without Seeding

**Location:** `backend/src/lib/generatePattern.ts`

**Debt:** Pattern generation uses `Math.random()` server-side. There is no seed, no replay capability, and no deterministic test mode. The endpoint `GET /api/game/pattern` is called every round.

**Cost:** Cannot replay a specific game for debugging or testing. Cannot write deterministic integration tests for the game flow without mocking the endpoint. Adds a network round-trip per round.

**Future consideration:** For Phase 6 games, consider whether pattern seeding or client-side generation is more appropriate per game type.

---

## TD-10: Session Token Stored in `localStorage`

**Location:** `web/src/features/auth/sessionStorage.ts`, `web/lib/AuthProvider.tsx`

**Debt:** JWT is stored in `localStorage`, making it accessible to any JavaScript on the page. This is an XSS risk. The industry-recommended alternative is `httpOnly` cookies.

**Cost:** If an XSS vulnerability is introduced anywhere (third-party script, injection), the auth token can be exfiltrated. Moving to cookies later is a breaking change to both the backend (needs cookie middleware) and all clients.

**Note:** For the current scope and threat model (personal project), this is acceptable. Document it and revisit before any public production release.

---

## TD-11: `web/package.json` Name Is Generic

**Location:** `web/package.json`

```json
{ "name": "web" }
```

**Debt:** The package name `"web"` is not scoped (`@medhatile/web`). pnpm filter commands use this name (`pnpm --filter web`). When `apps/admin` is added, an unscoped `admin` package name creates potential for conflicts and confusion.

**Fix in Phase 3:** Rename to `@medhatile/web`, `@medhatile/mobile`, `@medhatile/api`. Update all `--filter` references.
