Build MedhaTile with separate frontend and backend.

Current requirements:
- Frontend: React + Vite + TypeScript + Tailwind.
- Backend: Express + TypeScript.
- Phases: idle, reveal, recall, review, gameover.
- Reveal duration: 3 seconds.
- Mistake limit: 3.
- Best score in localStorage (`medhatile_best_score`).

Difficulty modes:
- Easy: grid 4, startTiles 3, maxTiles 10
- Medium: grid 6, startTiles 4, maxTiles 14
- Hard: grid 8, startTiles 5, maxTiles 20

Review phase rules:
- Show clicked correct as `OK`.
- Show missed correct as `.`.
- Show wrong click as `X`.
- Require user click on `Next` before showing game over modal.

Backend API:
- GET /api/health
- GET /api/levels
- GET /api/pattern?gridSize=<int>&count=<int>

Coding constraints:
- Keep components modular.
- No Redux/Zustand for this version.
- No auth/payments/ads/leaderboard/DB/AI/streaks.
- Mobile responsive, minimal UI, cognitive training style.

Process:
- Follow docs/PRODUCT_SPEC.md
- Follow docs/API_CONTRACT.md
- Follow docs/IMPLEMENTATION_STEPS.md
- Validate against docs/QA_CHECKLIST.md

