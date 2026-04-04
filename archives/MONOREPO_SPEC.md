# Monorepo Scaffold Spec

This repo now includes a parallel monorepo scaffold based on the requested target architecture:

```txt
medhatile/
  apps/
    web/
    mobile/
  packages/
    api/
    auth/
    game/
    types/
  backend/
```

## What Is Implemented

- `pnpm-workspace.yaml` defines the requested workspace layout.
- Root `package.json` now includes workspace-oriented scripts in addition to the existing npm scripts.
- `apps/web` contains a copied Vite app scaffold from the current `frontend` app.
- `apps/mobile` contains a React Native CLI starter shell and package manifest.
- `packages/types` centralizes auth, game, leaderboard, and movie types.
- `packages/game` centralizes current memory-game helpers and future board-mode helpers.
- `packages/auth` centralizes token-storage helpers.
- `packages/api` provides a shared Axios client plus auth/game/movies/leaderboard calls.

## What Still Needs Local Tooling

- `pnpm` is not installed in this environment, so the new workspace dependencies have not been installed yet.
- React Native CLI native folders (`android/`, `ios/`) were not generated here.
- The existing runnable app is still the current `frontend/` + `backend/` setup.

## Recommended Next Step

1. Install `pnpm`.
2. Run workspace install from the repo root.
3. Generate the React Native CLI native projects inside `apps/mobile`.
4. Incrementally switch CI/deploy/build commands from `frontend/` to `apps/web`.
