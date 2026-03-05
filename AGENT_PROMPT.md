Build MedhaTile with separate frontend and backend.

Current requirements:
- Frontend: React + Vite + TypeScript + Tailwind.
- Backend: Express + TypeScript.
- Phases: idle, reveal, recall, review.
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
- Blink correct answer tiles for 1 second after max mistakes.
- Restart same round automatically after review blink.

Backend API:
- GET /health
- GET /api/health
- GET /api/game/levels
- GET /api/game/pattern?gridSize=<int>&count=<int>
- POST /api/game/submit with `{ score, level }`

Coding constraints:
- Keep components modular.
- No Redux/Zustand for this version.
- No auth/payments/ads/leaderboard/DB/AI/streaks.
- Mobile responsive, minimal UI, cognitive training style.
- Add JSDoc comments for all declared functions in `frontend/src` and `backend/src`.

Process:
- Follow docs/PRODUCT_SPEC.md
- Follow docs/API_CONTRACT.md
- Follow docs/IMPLEMENTATION_STEPS.md
- Validate against docs/QA_CHECKLIST.md
