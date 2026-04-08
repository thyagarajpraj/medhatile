# MedhaTile

Build your mind, one tile at a time.

## What It Is
MedhaTile is a full-stack memory and tile game project with:
- `web/`: React + Vite app
- `mobile/`: React Native CLI app shell
- `shared/`: reusable API, game logic, and types
- `backend/`: Express + MongoDB API

The active architecture is a simple shared setup where both web and mobile consume the same backend and reuse the same shared modules.

## Features
- Email/password login and registration against the deployed backend
- Register flow includes `Confirm Password` validation before submit
- Stored web sessions are revalidated against `/api/auth/me` on reload
- Shared API layer for auth, score saving, and leaderboard loading
- Shared 2048-style tile movement and score logic used by both clients
- Web app routes for choose-game, 2048, identifying tiles, and leaderboard
- Top-right game dropdown for quickly switching between the available tile games
- Mobile app screens for auth, choose-game, 2048, and leaderboard
- Shared JWT-based auth flow:
  - Web stores session in `localStorage`
  - Mobile stores session in `AsyncStorage`

## Stack
- Web: React + Vite + TypeScript + React Router + React Query
- Mobile: React Native CLI + TypeScript + AsyncStorage
- Shared: TypeScript workspace packages
- Backend: Node.js + Express + TypeScript + MongoDB Atlas
- Package manager: pnpm workspaces

## Project Structure
```txt
medhatile/
|-- web/
|   |-- src/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   `-- index.css
|   `-- package.json
|-- mobile/
|   |-- src/
|   |   `-- App.tsx
|   |-- index.js
|   `-- package.json
|-- shared/
|   |-- api/
|   |   |-- api.ts
|   |   |-- auth.ts
|   |   `-- game.ts
|   |-- game/
|   |   `-- logic.ts
|   `-- types/
|       `-- index.ts
|-- backend/
|   |-- src/
|   `-- package.json
|-- docs/
|-- pnpm-workspace.yaml
`-- package.json
```

## Shared Reuse
Both apps now consume the same shared modules:
- [shared/api/index.ts](/d:/code/medhatile/shared/api/index.ts) for backend calls
- [shared/game/index.ts](/d:/code/medhatile/shared/game/index.ts) for reusable tile logic
- [shared/types/index.ts](/d:/code/medhatile/shared/types/index.ts) for shared TypeScript models

That means web and mobile no longer duplicate auth requests, leaderboard fetching, score saving, or core tile-board helpers.

## Setup
1. Install workspace dependencies:
```bash
npm run setup
```
2. Create backend env file:
```bash
copy backend\.env.example backend\.env
```
3. Set backend env values:
- `MONGO_URI=<your-mongodb-uri>`
- `JWT_SECRET=<long-random-secret>`
- `FRONTEND_ORIGIN=http://localhost:5173,https://medhatile.vercel.app`
- optional: `JWT_EXPIRES_IN_HOURS=24`
4. Run backend:
```bash
npm run dev:backend
```
5. Run web app in a new terminal:
```bash
npm run dev:web
```
6. Open:
```txt
http://localhost:5173/login
http://localhost:5173/
http://localhost:5173/games/adding
http://localhost:5173/games/identifying
http://localhost:5173/leaderboard
```

## Mobile Status
The mobile source is implemented and typechecked, but it is not launched automatically from this repo.

What is ready:
- shared API integration
- shared game logic integration
- auth flow with `Confirm Password`
- validated AsyncStorage session restore via `/api/auth/me`
- React Native CLI Metro config plus native `android/` and `ios/` project scaffolds
- choose-game, `2048`, and leaderboard mobile screens

What still needs local device setup:
- Metro + emulator or device execution
- workspace dependency install via `npm run setup`
- for iOS on macOS, `bundle install` and `bundle exec pod install` in `mobile/ios`
- the mobile `Identifying Tiles` experience in the next milestone

See [mobile/README.md](/d:/code/medhatile/mobile/README.md).

## Scripts
From repo root:
- `npm run setup`
- `npm run dev:web`
- `npm run dev:mobile`
- `npm run dev:backend`
- `npm run lint`
- `npm run test:web`
- `npm run test`
- `npm run coverage`
- `npm run precommit`
- `npm run build`

## Pre-Commit Workflow
The repo now includes a Husky + lint-staged pre-commit pipeline.

What it checks before a commit:
- staged JS/TS/TSX files are auto-linted with `eslint --fix`
- web tests pass
- web coverage runs and must stay at or above 85% line coverage
- the full workspace build passes
- `console.log` is blocked inside `web/src`

Files involved:
- [.husky/pre-commit](/d:/code/medhatile/.husky/pre-commit)
- [scripts/precommit-check.js](/d:/code/medhatile/scripts/precommit-check.js)
- [eslint.config.mjs](/d:/code/medhatile/eslint.config.mjs)

If hooks need to be reinitialized locally with Husky v9:
```bash
npx husky init
```

## Deployment
Backend (Render):
1. Push repo to GitHub.
2. Create a Render Web Service from [render.yaml](/d:/code/medhatile/render.yaml), or configure the service manually with root directory `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Env:
   - Do not set `PORT` manually; Render injects it.
   - `FRONTEND_ORIGIN=https://<your-vercel-domain>.vercel.app`
   - `MONGO_URI=<your-mongodb-uri>`
   - `JWT_SECRET=<long-random-secret>`

Web (Vercel):
1. Import project in Vercel.
2. Set root directory to `web`.
3. The shared API layer already targets `https://medhatile.onrender.com`.

## Notes
- The active workspace and build flow use `web/`, `mobile/`, `shared/`, and `backend/`.
- Retired code has been moved under [archives](/d:/code/medhatile/archives) so it can be reviewed or deleted later.
- The remaining files under [frontend](/d:/code/medhatile/frontend) are local legacy artifacts such as `node_modules/`, `dist/`, and empty folders left behind after archiving the old source.

