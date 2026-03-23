# MedhaTile

Build your mind, one tile at a time.

## What It Is
MedhaTile is a cognitive training game focused on:
- Working memory
- Focus
- Pattern recall
- Attention control

This repo uses a split architecture (`frontend` + `backend`).

## Features
- Start screen with best score
- Development-only app navigation links:
  - `Game` -> `/`
  - `Movies` -> `/movies`
- Production UI behavior:
  - only `Game` view is rendered
  - top header/nav is hidden
- Difficulty mode dropdown before starting:
  - Easy: 4x4, starts at 3 tiles
  - Medium: 6x6, starts at 4 tiles
  - Hard: 8x8, starts at 5 tiles
- Reveal phase for 1 second
- Recall phase with mistakes tracking
- Review phase showing:
  - Clicked correct (`OK`)
  - Missed correct (`.`)
  - Wrong click (`X`)
- 3 mistakes trigger 1-second answer blink and same-round restart
- Back to Start control returns to the start screen during gameplay
- Best score persisted in localStorage (`medhatile_best_score`)
- Movies section connected to MongoDB `sample_mflix.movies` with:
  - list and title search
  - create movie
  - update movie
  - delete movie

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript

## Project Structure
```txt
medhatile/
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- features/
|   |   |   `-- movies/
|   |   |       |-- components/
|   |   |       |-- services/
|   |   |       `-- types/
|   `-- .env.example
|-- backend/
|   |-- src/
|   |   |-- features/
|   |   |   `-- movies/
|   |   |       |-- controllers/
|   |   |       |-- models/
|   |   |       `-- routes/
|   `-- .env.example
|-- docs/
|   |-- PRODUCT_SPEC.md
|   |-- API_CONTRACT.md
|   |-- IMPLEMENTATION_STEPS.md
|   |-- DEPLOYMENT_STATUS.md
|   `-- QA_CHECKLIST.md
|-- AGENT_PROMPT.md
`-- README.md
```

## Deployment Tracking
- Current deployment plan and status: `docs/DEPLOYMENT_STATUS.md`

## Setup
1. Install frontend and backend dependencies:
```bash
npm run setup
```
2. Create env files:
```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```
Default env values:
- `backend/.env`: `PORT=5000`, `FRONTEND_ORIGIN=http://localhost:5173`, `ROUNDS_PER_LEVEL=5`
- `frontend/.env.development`: `VITE_API_BASE_URL=http://127.0.0.1:5000/api`
- `frontend/.env.production`: `VITE_API_BASE_URL=/api` (override in Vercel with deployed backend URL)
3. Run backend:
```bash
npm run dev:backend
```
4. Run frontend (new terminal):
```bash
npm run dev:frontend
```
5. Open app routes:
```txt
http://localhost:5173/
http://localhost:5173/movies
```
Note:
- `/movies` is available in development.
- In production, only `/` (game view) is shown by design.

## Scripts
From repo root:
- `npm run setup`
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build`

## Code Documentation
- JSDoc is required for all declared functions in `frontend/src` and `backend/src`.
- Keep descriptions short and focused on behavior, inputs, and outcomes.

## GitHub
- CI workflow: `.github/workflows/ci.yml`
- Runs on every push and pull request:
  - Frontend: install, test, build
  - Backend: install, build

## Deployment
Backend (Render):
1. Push repo to GitHub.
2. Create Render Web Service for `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server.js`
5. Env:
   - `PORT=5000`
   - `FRONTEND_ORIGIN=https://<your-vercel-domain>.vercel.app`

Frontend (Vercel):
1. Import project in Vercel.
2. Set root directory to `frontend`.
3. Set env var:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

