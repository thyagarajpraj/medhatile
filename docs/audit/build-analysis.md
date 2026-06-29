# Build Analysis

**Audited:** 2026-06-29

## Root Build Command

```json
"build": "corepack pnpm --filter web build && corepack pnpm --filter backend build && corepack pnpm --filter mobile typecheck"
```

**Verified working:** June 11, 2026 (per `PROJECT_STATUS_AND_RULES.md`)

### What the build does

1. **Web:** `tsc && next build`
   - TypeScript compilation check first
   - Then Next.js build (SSR/SSG output)
   - Output: `.next/` directory

2. **Backend:** `tsc -p tsconfig.json`
   - TypeScript to JavaScript compilation only
   - Output: `dist/` directory
   - No bundling — Node.js CommonJS output

3. **Mobile:** `tsc --noEmit`
   - Type check only — no compilation artifact
   - Android/iOS builds require native tooling (Gradle, Xcode) separately

### Gaps in the root build

| Gap | Impact |
|---|---|
| Mobile typecheck only, not a real build | A type-passing mobile app may have runtime errors not caught by `tsc --noEmit` |
| Shared packages have no build step | Shared packages are consumed as raw TypeScript source — any TS error in shared code is caught by consumer builds, not by a shared package build |
| No parallel execution | Three builds run serially. As packages grow this becomes slow. Consider `turbo` or `pnpm --filter ... --parallel` |
| No build caching | Every build compiles everything from scratch |

---

## Per-Package Build Details

### `web/`

```json
"build": "tsc && next build"
```

- TypeScript strict mode (via `tsconfig.json`) runs first — good
- `next build` produces an optimized production bundle
- No bundle analysis configured (e.g., `@next/bundle-analyzer`)
- No custom webpack/turbopack config in `next.config.ts`

**Observed config (`next.config.ts` not read in detail):** Standard Next.js config. No special plugins visible.

### `backend/`

```json
"build": "tsc -p tsconfig.json",
"start": "node dist/server.js"
```

- Compiles TypeScript to `dist/`
- `package-lock.json` present in `backend/` — mixing npm and pnpm lock files
- Render deployment runs `npm install && npm run build` (uses npm, not pnpm) — intentional because Render manages its own package install separately from the pnpm workspace

### `mobile/`

```json
"typecheck": "tsc --noEmit"
```

- No production build from JS tooling
- Android release build: `cd android && ./gradlew bundleRelease`
- iOS release build: Xcode archive
- Neither is currently automated in CI

---

## Precommit Gate

```sh
# .husky/pre-commit
npm run precommit
```

```json
"precommit": "lint-staged && npm run test && npm run coverage && npm run build && node scripts/precommit-check.js"
```

**Steps:**
1. `lint-staged` — ESLint on staged `.{js,ts,tsx}` files
2. `npm run test` → `pnpm --filter web test` — runs vitest
3. `npm run coverage` → `pnpm --filter web coverage` — runs vitest with coverage
4. `npm run build` — full three-app build
5. `node scripts/precommit-check.js` — validates coverage thresholds

**Issues with precommit:**
- Uses `npm run` in a pnpm project — works incidentally but inconsistent
- Runs full build on every commit — slow for large commits
- Coverage threshold check runs on every commit even for backend-only changes
- No incremental/affected-only checking

---

## CI Build (`.github/workflows/ci.yml`)

**Status: BROKEN**

```yaml
frontend:
  defaults:
    run:
      working-directory: frontend   # ← does not exist
  steps:
    - uses: actions/setup-node@v4
      with:
        cache: npm
        cache-dependency-path: frontend/package-lock.json   # ← does not exist
    - run: npm ci    # ← wrong package manager
    - run: npm run test
    - run: npm run build

backend:
  defaults:
    run:
      working-directory: backend   # ← exists, but...
    - run: npm ci    # ← wrong package manager for pnpm project
```

**Specific failures:**
1. `frontend` job fails immediately — directory does not exist
2. `backend` job uses `npm ci` with a `package-lock.json` that exists in `backend/` — this actually works for the backend in isolation since it has its own `package-lock.json`
3. No pnpm setup step (`pnpm/action-setup`)
4. No shared package build step
5. No lint job
6. No coverage job
7. No mobile typecheck job

**Required CI rewrite (Phase 3):**
```yaml
jobs:
  lint:     → pnpm --filter web lint + ESLint root
  test:     → pnpm --filter web test + coverage
  build:    → pnpm --filter web build + backend build + mobile typecheck
  shared:   → validate shared packages compile
```

---

## Test Coverage

**Web:** Vitest with `@vitest/coverage-v8`
- Coverage threshold enforced in `scripts/precommit-check.js` (85% minimum)
- Tests found in:
  - `web/src/features/auth/AuthGate.test.tsx`
  - `web/src/features/identifying/logic.test.ts`
  - `web/src/features/navigation/GameRouteSelect.test.tsx`

**Backend:** `node --test dist` (runs compiled output)
- Only `backend/src/app.test.ts` found
- No feature-level test files visible
- Very low coverage

**Mobile:** No tests exist

**Shared packages:** No tests in `shared/game/`, `shared/api/`, or `shared/types/`

**Overall test coverage grade: D**
Web has basic test setup. Backend has one test file. Mobile has none. Shared packages have none. Phase 9 will address this systematically.

---

## TypeScript Strictness

Each package has a `tsconfig.json`. Web and backend both appear to use strict settings based on code quality observed (explicit return types, no `any` visible in audited files). Mobile uses `@react-native/typescript-config`. No root base config exists yet (see TD-06).
