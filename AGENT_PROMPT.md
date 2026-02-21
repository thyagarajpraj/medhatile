Build MedhaTile with separate frontend and backend.

Requirements:
- Frontend: React + Vite + TypeScript + Tailwind.
- Backend: Express + TypeScript.
- Phases: idle, reveal, recall, gameover.
- Reveal duration: 3 seconds.
- Mistake limit: 3.
- Best score in localStorage.
- Difficulty progression exactly:
  - 4x4 / 3
  - 4x4 / 4
  - 6x6 / 5
  - 6x6 / 6
  - 8x8 / 7

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
