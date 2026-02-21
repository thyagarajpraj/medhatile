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
- Difficulty mode dropdown before starting:
  - Easy: 4x4, starts at 3 tiles
  - Medium: 6x6, starts at 4 tiles
  - Hard: 8x8, starts at 5 tiles
- Reveal phase for 3 seconds
- Recall phase with mistakes tracking
- Review phase showing:
  - Clicked correct (`OK`)
  - Missed correct (`.`)
  - Wrong click (`X`)
- 3 mistakes end the run
- Game over modal with restart
- Best score persisted in localStorage (`medhatile_best_score`)

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
|   `-- .env.example
|-- backend/
|   |-- src/
|   `-- .env.example
|-- docs/
|   |-- PRODUCT_SPEC.md
|   |-- API_CONTRACT.md
|   |-- IMPLEMENTATION_STEPS.md
|   `-- QA_CHECKLIST.md
|-- AGENT_PROMPT.md
`-- README.md
```

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
3. Run backend:
```bash
npm run dev:backend
```
4. Run frontend (new terminal):
```bash
npm run dev:frontend
```

## Scripts
From repo root:
- `npm run setup`
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build`

## GitHub
- CI workflow: `.github/workflows/ci.yml`
- Runs on every push and pull request:
  - Frontend: install, test, build
  - Backend: install, build

