# MedhaTile

Build your mind, one tile at a time.

## Purpose
MedhaTile is a cognitive training game focused on:
- Working memory
- Focus
- Pattern recall
- Attention control

This repository contains the full build documentation and execution steps for a split architecture (`frontend` + `backend`).

## Scope
Included:
- Start screen with best score
- Timed reveal phase (3s)
- Recall phase with correct/wrong tile feedback
- 3-mistake fail rule
- Level progression by difficulty table
- Game over modal with restart
- localStorage best score

Excluded:
- Auth
- Payments
- Ads
- Leaderboard
- Database persistence
- AI features
- Streak system

## Difficulty Table
| Level | Grid | Tiles |
|---|---|---|
| 1 | 4x4 | 3 |
| 2 | 4x4 | 4 |
| 3 | 6x6 | 5 |
| 4 | 6x6 | 6 |
| 5 | 8x8 | 7 |

## Target Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Deployment: Vercel (frontend), Render/Railway/Fly/VM (backend)

## Target Structure
```txt
medhatile/
├── frontend/
│   ├── src/
│   └── .env.example
├── backend/
│   ├── src/
│   └── .env.example
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── API_CONTRACT.md
│   ├── IMPLEMENTATION_STEPS.md
│   └── QA_CHECKLIST.md
├── AGENT_PROMPT.md
└── README.md
```

## Execution Order
1. Read `docs/PRODUCT_SPEC.md`.
2. Implement backend API from `docs/API_CONTRACT.md`.
3. Build frontend game engine and components.
4. Wire frontend to backend.
5. Run validation from `docs/QA_CHECKLIST.md`.

## Quick Start (After FE/BE Apps Exist)
1. Backend:
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
2. Frontend:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Notes
- This root is cleaned to a split frontend/backend documentation baseline.
- The implementation target is split frontend/backend, not Next.js API routes.
- Use `AGENT_PROMPT.md` to hand off implementation to an AI coding agent.

## GitHub
- CI workflow added at `.github/workflows/ci.yml`.
- On every push and pull request:
  - Frontend installs, runs tests, then builds.
  - Backend installs and builds.
