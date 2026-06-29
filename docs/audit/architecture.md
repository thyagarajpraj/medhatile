# Architecture Audit

**Audited:** 2026-06-29

## System Overview

MedhaTile is a cognitive training platform hosted as a pnpm monorepo. It consists of four runtime targets (web, mobile, backend, shared packages) managed under a single workspace root.

```
medhatile/                          ← pnpm workspace root (private)
├── web/                            ← Next.js 16 web app
├── mobile/                         ← React Native CLI 0.78 app
├── backend/                        ← Express 5 + TypeScript API
├── shared/
│   ├── api/                        ← @medhatile/shared-api
│   ├── game/                       ← @medhatile/shared-game
│   └── types/                      ← @medhatile/shared-types
├── docs/                           ← product and process docs
├── archives/                       ← retired code (Vite frontend, early scaffold)
├── scripts/                        ← root-level dev scripts
└── .github/workflows/ci.yml        ← GitHub Actions CI (currently broken)
```

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Web framework | Next.js App Router | ^16.2.9 |
| Web UI | React + TypeScript | 19.x / ~5.9 |
| Styling | Tailwind CSS v4 + PostCSS | ^4.3.1 |
| Data fetching (web) | TanStack React Query | ^5.90.21 |
| HTTP client | Axios | ^1.8.4 |
| Mobile framework | React Native CLI | ^0.78.0 |
| Mobile storage | AsyncStorage | ^2.1.2 |
| Backend framework | Express | ^5.2.1 |
| Backend ORM | Mongoose | ^9.2.3 |
| Database | MongoDB Atlas | — |
| Auth mechanism | JWT (signed, bearer token) | — |
| Package manager | pnpm | 10.8.1 |
| Test runner | Vitest | ^4.0.18 |
| Linter | ESLint 10 + typescript-eslint | ^10.2 / ^8.58 |
| Git hooks | Husky + lint-staged | ^9.1.7 / ^16.4 |
| Deployment (backend) | Render | — |
| Deployment (web) | Vercel (planned) | — |

## Workspace Dependency Graph

```
@medhatile/shared-types      (no deps)
       ↑
@medhatile/shared-game       (depends on shared-types)
       ↑
@medhatile/shared-api        (depends on shared-types)
       ↑               ↑
     web             mobile
```

`backend` does not consume any shared packages. It re-implements types independently.

## Web App Structure

```
web/
├── app/                            ← Next.js App Router pages
│   ├── layout.tsx                  ← root layout + providers
│   ├── providers.tsx               ← React Query + Auth providers
│   ├── login/page.tsx              ← unauthenticated auth gate
│   └── (protected)/                ← route group, requires auth
│       ├── layout.tsx              ← shell + nav header
│       ├── page.tsx                ← choose-game screen (/)
│       ├── games/adding/page.tsx   ← 2048 game
│       ├── games/identifying/page.tsx ← memory tile game
│       └── leaderboard/page.tsx    ← leaderboard
├── lib/
│   ├── AppShell.tsx                ← layout chrome
│   └── AuthProvider.tsx            ← auth context + session restore
└── src/
    ├── components/ui.tsx           ← shared UI primitives
    ├── features/
    │   ├── adding/                 ← 2048 game feature
    │   ├── auth/                   ← AuthGate, sessionStorage
    │   ├── identifying/            ← memory tile game + logic
    │   ├── leaderboard/            ← leaderboard view
    │   └── navigation/             ← game route dropdown
    └── test/setup.ts
```

## Mobile App Structure

```
mobile/
├── src/
│   ├── App.tsx / AppMain.tsx       ← root navigation + auth gate
│   └── features/
│       ├── auth/                   ← AuthGate, authStorage, validation
│       ├── game2048/               ← 2048 screen + logic + constants
│       ├── identifying/            ← memory tile screen (in progress)
│       ├── leaderboard/            ← leaderboard screen
│       └── navigation/             ← ChooseGameScreen
├── android/                        ← native Android project
└── ios/                            ← native iOS project
```

## Backend Structure

```
backend/src/
├── app.ts                          ← Express app + CORS + middleware + routes
├── server.ts                       ← process entry, DB connect, listen
├── config/db.ts                    ← MongoDB/Mongoose connection
├── features/
│   ├── auth/                       ← controllers, models, middleware, routes
│   └── movies/                     ← CRUD controllers, models, routes
├── controllers/
│   ├── game.controller.ts          ← pattern, levels, config, submit, best-score
│   └── leaderboard.controller.ts   ← leaderboard endpoints
├── routes/
│   ├── game.routes.ts
│   └── leaderboard.routes.ts
├── lib/
│   ├── config.ts                   ← env parsing
│   ├── difficulty.ts               ← difficulty level config
│   └── generatePattern.ts          ← server-side pattern generation
├── middleware/requireDatabase.ts
└── types/
    ├── express.d.ts                ← augments Request with authUser
    └── game.ts
```

## Auth Flow

```
Client → POST /api/auth/register or /login
       ← { token, user }
Client stores token in localStorage (web) / AsyncStorage (mobile)

Client → GET /api/auth/me (Bearer token)
       ← { user } or 401

All subsequent API calls → Authorization: Bearer <token>
Backend middleware → verifyAuthToken → attaches req.authUser
```

## Game Data Flow — Identifying Tiles

```
1. Client: getDifficultyConfig(mode) → gridSize, startTiles
2. Client → GET /api/game/pattern?gridSize=N&count=M
3. Backend → generatePattern() → unique indices
4. Client: phase "reveal" → show tiles for 1s
5. Client: phase "recall" → user taps tiles
6. Correct tap  → tracked in userSelections
7. Wrong tap    → mistakes++
8. 3 mistakes   → phase "review" → blink correct tiles 1s → restart
9. Round clear  → tilesToRemember++ → next round
10. Round complete → POST /api/game/submit { score, level }
11. Backend → update user.bestScore if new high score
```

## Active API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /health | No | Process health |
| GET | /api/health | No | API health |
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Get token |
| GET | /api/auth/me | Yes | Restore session |
| GET | /api/game/levels | Yes | Level config |
| GET | /api/game/config | Yes | rounds per level |
| GET | /api/game/pattern | Yes | Pattern indices |
| POST | /api/game/submit | Yes | Submit score |
| POST | /api/game/best-score/sync | Yes | Sync best score |
| GET | /api/leaderboard | Yes | Leaderboard |
| GET/POST | /api/movies | Yes | Movies CRUD |
| GET/PUT/DELETE | /api/movies/:id | Yes | Movie by id |

## Key Architectural Decisions (observed, not documented)

- **Pattern generation is server-side** — backend generates randomness, not client. Consistent with security best practice but adds a network round-trip per game round.
- **JWT is stateless** — no token revocation mechanism. Sign-out is client-side localStorage clear only.
- **Shared packages ship TypeScript source directly** — no compile step in shared packages. Consumers (web, mobile) compile them as part of their own build via TypeScript path resolution. This works but is non-standard for published packages.
- **Movies feature exists backend-only** — full CRUD API present but no web UI. Appears to be a MongoDB integration smoke test, not a product feature.
- **No state management library** — React context + TanStack Query for server state. Appropriate for current scope.
