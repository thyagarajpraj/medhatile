# Folder Analysis

**Audited:** 2026-06-29

## Root

| Item | Type | Status | Notes |
|---|---|---|---|
| `web/` | workspace | Active | Next.js app |
| `mobile/` | workspace | Active | React Native CLI app |
| `backend/` | workspace | Active | Express API |
| `shared/` | workspaces | Active | 3 shared packages |
| `docs/` | documentation | Active | Product docs |
| `archives/` | dead code | Stale | Delete in Phase 3 |
| `scripts/` | tooling | Active | 1 file |
| `.github/` | CI | Broken | CI references deleted directory |
| `.husky/` | git hooks | Active | pre-commit only |
| `mongoDB Cred.txt` | credentials | CRITICAL | Must be removed and history cleaned |
| `node.msi` | binary | Dead | 28 MB installer — remove from git |
| `AGENTS.md` | documentation | Active | Builder/Reviewer workflow |
| `AGENT_PROMPT.md` | documentation | Active | Constraint rules |
| `README.md` | documentation | Active | Project overview |
| `package.json` | config | Active | Workspace root |
| `pnpm-workspace.yaml` | config | Active | Workspace definitions |
| `pnpm-lock.yaml` | lockfile | Active | — |
| `eslint.config.mjs` | config | Active | Flat config, modern |
| `render.yaml` | deployment | Active | Backend Render config |
| `.env.example` | config | Active | Template for env vars |
| `.gitignore` | config | Active | — |

**Root assessment:** Clean for a monorepo root except for the two critical files (`mongoDB Cred.txt`, `node.msi`) and the stale `archives/`.

---

## `web/` — Next.js App

```
web/
├── app/                    ← App Router — pages and layouts
│   ├── layout.tsx          ← root layout, mounts providers
│   ├── providers.tsx       ← QueryClientProvider + AuthProvider
│   ├── login/page.tsx      ← auth gate (public)
│   └── (protected)/        ← route group requiring auth
│       ├── layout.tsx      ← AppShell with nav header
│       ├── page.tsx        ← / → choose-game
│       ├── games/adding/   ← 2048
│       ├── games/identifying/ ← memory tiles
│       └── leaderboard/    ← leaderboard
├── lib/
│   ├── AppShell.tsx        ← navigation chrome
│   └── AuthProvider.tsx    ← auth context, session restore
├── src/
│   ├── components/ui.tsx   ← shared primitive components
│   ├── features/           ← feature modules
│   │   ├── adding/         ← 2048 game
│   │   ├── auth/           ← AuthGate, sessionStorage
│   │   ├── identifying/    ← memory tile game + logic + tests
│   │   ├── leaderboard/    ← LeaderboardView
│   │   └── navigation/     ← GameRouteSelect (dropdown)
│   ├── index.css           ← global styles entry
│   └── test/setup.ts       ← vitest/jsdom setup
├── next.config.ts          ← Next.js config
├── postcss.config.mjs      ← Tailwind + PostCSS
├── tsconfig.json           ← TypeScript config
└── vitest.config.ts        ← test config
```

**Issues:**
- `lib/` and `src/` split is redundant for App Router. `AuthProvider` and `AppShell` could live in `src/` under a `providers/` or `layout/` folder.
- No `public/` directory — no favicon, icons, or OG images.
- No `app/error.tsx` or `app/not-found.tsx` — error boundaries missing.

---

## `mobile/` — React Native App

```
mobile/
├── src/
│   ├── App.tsx / AppMain.tsx / AppDummy.tsx
│   └── features/
│       ├── auth/           ← AuthGate, storage, validation
│       ├── game2048/       ← 2048 screen + logic + constants
│       ├── identifying/    ← IN PROGRESS (partial)
│       ├── leaderboard/    ← LeaderboardScreen
│       └── navigation/     ← ChooseGameScreen
├── android/                ← native Android project
├── ios/                    ← native iOS project
├── scripts/                ← metro, android dev helpers
├── index.js                ← RN entry point
└── app.json                ← app config
```

**Issues:**
- `AppDummy.tsx` — placeholder/debug component should be removed
- `App.tsx` / `AppMain.tsx` — two root app files; unclear which is active entry
- Identifying tiles is in progress — feature gap vs web
- No test directory — no tests at all in mobile
- ESLint explicitly ignores `mobile/**`
- No Detox or any E2E test setup

---

## `backend/` — Express API

```
backend/src/
├── app.ts                  ← Express instance + routes
├── server.ts               ← entry point, DB connect, listen
├── config/db.ts            ← Mongoose connection
├── features/
│   ├── auth/               ← register, login, me endpoints
│   └── movies/             ← full CRUD (MongoDB smoke test)
├── controllers/
│   ├── game.controller.ts  ← game logic endpoints
│   └── leaderboard.controller.ts
├── routes/
│   ├── game.routes.ts
│   └── leaderboard.routes.ts
├── lib/
│   ├── config.ts           ← env parsing
│   ├── difficulty.ts       ← duplicate of web logic
│   └── generatePattern.ts  ← duplicate of shared logic
├── middleware/requireDatabase.ts
└── types/
    ├── express.d.ts        ← Request augmentation
    └── game.ts             ← duplicate types
```

**Issues:**
- `lib/difficulty.ts` and `lib/generatePattern.ts` duplicate shared package code
- `__mongo_test.js` in `backend/` root — exploratory test file committed
- `package-lock.json` in `backend/` — mixing lock file formats in a pnpm project
- `features/movies/` is a CRUD probe with no product purpose documented
- No middleware for request validation (e.g., zod, express-validator)
- No rate limiting
- No request ID / correlation ID for log tracing

---

## `shared/` — Shared Packages

```
shared/
├── api/
│   ├── api.ts      ← Axios instance + setAuthToken
│   ├── auth.ts     ← login, register, getCurrentUser
│   ├── game.ts     ← getLeaderboard, saveScore
│   └── index.ts    ← re-exports all
├── game/
│   ├── logic.ts    ← 2048 pure functions (excellent)
│   └── index.ts    ← re-exports
└── types/
    └── index.ts    ← User, AuthCredentials, AuthSession,
                       LeaderboardEntry, Board, GameState
```

**Issues:**
- No `tsconfig.json` per package
- No `build` script per package
- `"main": "./index.ts"` — ships source, not compiled output
- Identifying tiles types (`Phase`, `DifficultyConfig`, `IdentifyGameState`) are in `web/src/features/identifying/logic.ts` — should be in `shared/types`
- Mobile-specific identifying logic is in `mobile/src/features/identifying/logic.ts` — should also use shared package
- No README per package

---

## `docs/` — Documentation

```
docs/
├── API_CONTRACT.md         ← endpoint contracts (excellent)
├── DEPLOYMENT_STATUS.md    ← current deployment state
├── IMPLEMENTATION_STEPS.md ← delivery sequence
├── MOBILE_PLAYSTORE_RELEASE.md ← Android release checklist
├── PRODUCT_SPEC.md         ← product behavior spec (excellent)
├── PROJECT_STATUS_AND_RULES.md ← rules and status (excellent)
└── QA_CHECKLIST.md         ← acceptance criteria (good)
```

**Missing (added by Phase 2):**
- Architecture decision records
- Coding standards
- Git workflow
- Testing strategy
- Performance budget
- Accessibility guidelines
- Security policy
- Game design standards
- Contribution guide

---

## `archives/` — Dead Code

```
archives/
├── frontend/       ← Vite React app (pre-Next.js migration)
├── apps/
│   ├── web/        ← copy of Vite app in monorepo layout
│   └── mobile/     ← early React Native stub
└── packages/
    ├── api/        ← early API package stub
    ├── auth/       ← early auth package stub
    ├── game/       ← early game package stub
    └── types/      ← early types package stub
```

**Assessment:** All content is superseded. The early monorepo scaffold in `archives/packages/` predates the current `shared/` packages. This directory should be tagged and removed in Phase 3.

---

## `scripts/`

```
scripts/
└── precommit-check.js    ← validates coverage thresholds
```

Single file. Runs as part of the precommit hook. No other automation scripts. Phase 3+ will add migration, scaffolding, and deployment scripts here.

---

## `.github/`

```
.github/
└── workflows/
    └── ci.yml    ← BROKEN (targets deleted frontend/ directory)
```

Missing:
- `CODEOWNERS`
- PR template
- Issue templates
- Dependabot config
- CodeQL config
- `copilot-instructions.md`
- `AGENTS.md` (GitHub-level)
- `instructions/` per the master prompt's `.github/` spec
