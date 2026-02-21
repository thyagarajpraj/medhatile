# Implementation Steps

1. Backend setup
- Initialize Express + TypeScript app in `backend/`.
- Add CORS and JSON middleware.
- Implement `/api/health`, `/api/levels`, `/api/pattern`.
- Add scripts: `dev`, `build`, `start`.

2. Frontend setup
- Initialize React + Vite + TypeScript + Tailwind in `frontend/`.
- Build components: `Header`, `Grid`, `Tile`, `GameOverModal`.
- Define shared types in `frontend/src/types/game.ts`.

3. Game engine
- Implement state machine (`idle`, `reveal`, `recall`, `gameover`).
- Reveal timer: 3000ms.
- Mistake limit: 3.
- Level advancement on successful recall.

4. Data integration
- Fetch levels from backend on app load.
- Fetch pattern per round from backend.
- Add frontend fallback local generator if API fails.

5. Persistence
- Store and load best score from localStorage key:
  - `medhatile_best_score`

6. Responsive polish
- Ensure board fits mobile widths.
- Keep text legible and controls tappable.

7. Validation
- Run type checks and production builds for both apps.
- Test full loop manually: start -> reveal -> recall -> game over -> restart.

