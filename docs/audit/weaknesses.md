# Weaknesses Audit

**Audited:** 2026-06-29

Weaknesses are problems that exist now and affect correctness, security, or maintainability. Contrast with [technical-debt.md](./technical-debt.md) which covers design choices that slow future work.

---

## CRITICAL

### W-01: Plaintext Credentials Committed to Repository

**File:** `mongoDB Cred.txt` (repo root)

**Content:** Two MongoDB Atlas connection strings including passwords, plus raw username/password pairs.

```
medhauser / Medha@12345
MONGO_URI=mongodb+srv://medhauser:Medha@12345@cluster0.dsn6vws.mongodb.net/...
MONGO_URI=mongodb+srv://medhauser:Medha12345@cluster0.dsn6vws.mongodb.net/medhatile...
```

**Impact:** Anyone with read access to this repository can access the MongoDB Atlas cluster. These credentials are in git history even if the file is deleted. The cluster may contain real user data (email addresses, hashed passwords, scores).

**Fix required before any other work:**
1. Rotate both MongoDB Atlas passwords immediately.
2. Remove the file from git history using `git filter-repo` or BFG Repo Cleaner.
3. Force-push the cleaned history.
4. Verify no `.env` files with secrets are tracked.

---

### W-02: CI Workflow Targets Non-Existent Directory

**File:** `.github/workflows/ci.yml`

**Problem:** The workflow sets `working-directory: frontend` for the frontend job. The `frontend/` directory was removed when the project migrated to Next.js in `web/`. CI has been permanently broken since that migration.

```yaml
defaults:
  run:
    working-directory: frontend   # ← does not exist
```

Additionally:
- Uses `npm ci` and `cache: npm` in a pnpm workspace project
- References `frontend/package-lock.json` which does not exist
- Does not run any mobile checks
- Does not run lint or coverage

**Impact:** Every push and PR runs a CI job that fails immediately. No automated quality gate exists on the remote.

---

### W-03: Binary Installer Committed to Git

**File:** `node.msi` (repo root)

**Impact:** ~28 MB Windows installer binary is tracked in git, bloating clone size for every contributor. Git is not suited for binary file storage.

**Fix:** Remove from tracking and git history. Add `*.msi` to `.gitignore`.

---

## HIGH

### W-04: No JWT Revocation

**Location:** `backend/src/features/auth/lib/token.ts`

**Problem:** JWT tokens are stateless with no server-side revocation. Sign-out is a client-side localStorage clear. A stolen token remains valid until expiry (`JWT_EXPIRES_IN_HOURS=24` per `render.yaml`).

**Impact:** No way to invalidate a compromised token. Stolen sessions are valid for up to 24 hours.

---

### W-05: Error Details Leaked in 500 Responses

**Location:** `backend/src/features/auth/controllers/auth.controller.ts:127,153`

```ts
res.status(500).json({ error: "Failed to register user", details: String(error) });
```

**Impact:** Internal error messages (stack traces, driver error messages, connection strings) may be included in `details` and returned to the client. This leaks internal implementation details and potentially sensitive information.

---

### W-06: Mobile Feature Parity Gap

**Location:** `mobile/src/features/identifying/`

**Problem:** `PROJECT_STATUS_AND_RULES.md` records "Mobile identifying tiles: In Progress." The web version is complete but the mobile version is incomplete. The mobile app has a partial `IdentifyingTilesScreen.tsx` and `logic.ts` but feature parity is not yet achieved.

**Impact:** Mobile app cannot be released to Play Store with a broken or missing game screen.

---

### W-07: Shared Packages Have No Build Step

**Location:** `shared/game/package.json`, `shared/api/package.json`, `shared/types/package.json`

```json
{
  "main": "./index.ts",
  "types": "./index.ts"
}
```

**Problem:** Packages export raw `.ts` source files. This only works because web and mobile compile them as part of their own TypeScript build. If any consumer does not have TypeScript configured to resolve these (or if a plain JS consumer is added), imports will fail silently or at runtime.

**Impact:** Brittle cross-package resolution. Cannot publish packages to npm. Build breaks are silent until the consumer's TypeScript compiler runs.

---

### W-08: Root package.json Has `mongodb` in Dependencies

**Location:** `package.json:24`

```json
"dependencies": {
  "mongodb": "^7.1.0"
}
```

**Problem:** The MongoDB driver is installed at the workspace root. It belongs in `backend/` only. This adds it to every package's `node_modules` unnecessarily and creates a version conflict risk with `backend/package.json` which also declares `mongodb: "^7.1.1"`.

---

### W-09: ESLint Ignores the Entire Mobile Directory

**Location:** `eslint.config.mjs:12`

```ts
const ignoredPaths = [
  ...
  "mobile/**",
];
```

**Problem:** Mobile TypeScript and TSX files are never linted. Code quality issues, potential bugs, and style inconsistencies in the mobile app go undetected.

---

### W-10: Pre-commit Hook Uses npm in a pnpm Project

**Location:** `.husky/pre-commit`, root `package.json`

```sh
npm run precommit
```

```json
"precommit": "lint-staged && npm run test && npm run coverage && npm run build && node scripts/precommit-check.js"
```

**Problem:** The pre-commit hook and the `precommit` script both invoke `npm run` in a project managed with `pnpm`. This works incidentally (npm can invoke scripts from `package.json`) but is inconsistent and may behave differently if `npm` is not installed or `corepack` intercepts the call.

---

## MEDIUM

### W-11: `LeaderboardEntry.mode` Type Is Ahead of Implementation

**Location:** `shared/types/index.ts:14`

```ts
export type LeaderboardEntry = {
  mode: "classic" | "timed" | "challenge";
  ...
};
```

**Problem:** Only one game mode exists. `"timed"` and `"challenge"` are not implemented. The type implies a UI and backend that do not exist.

---

### W-12: Movies Feature Has No Web UI

**Location:** `backend/src/features/movies/`, `docs/API_CONTRACT.md`

**Problem:** Full CRUD REST API exists for movies, documented in `API_CONTRACT.md` and tested in `QA_CHECKLIST.md`. However there is no web or mobile UI for movies. The feature appears to be a MongoDB CRUD probe/smoke test. Its presence in the contract and QA checklist creates ambiguity about what is actually a product feature.

---

### W-13: `calcScore` Bug in 2048 Logic

**Location:** `shared/game/logic.ts:107`

```ts
export function calculateScore(board: Board): number {
  return board.flat().reduce((total, value) => total + value, 0);
}
```

**Problem:** This sums all tile values, not the score earned from merges. In 2048, score is earned when two tiles merge (the merged value is added to the score). Summing the board gives a proxy that grows with progress but is not the canonical 2048 score. If users compare scores, the metric is non-standard.

---

### W-14: No Input Sanitization Beyond Length/Regex in Backend

**Location:** `backend/src/features/auth/controllers/auth.controller.ts`

**Problem:** Email and password are validated for format but no sanitization is applied before Mongoose operations. Mongoose does protect against NoSQL injection for most operations, but custom queries or future additions may not be protected automatically.

---

### W-15: `AppDummy.tsx` in Production Code

**Location:** `mobile/src/AppDummy.tsx`

**Problem:** A placeholder or debugging component is committed in the `src/` directory. If it is imported anywhere it adds dead code. If not imported it is still clutter.
