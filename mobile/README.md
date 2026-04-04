# MedhaTile Mobile

This folder contains the shared-logic React Native CLI app shell for MedhaTile.

What is ready:
- shared API wiring through `shared/api`
- shared 2048-style game logic through `shared/game`
- login, game, and leaderboard screens in `src/App.tsx`
- AsyncStorage-backed token persistence

What still needs a local machine step:
- generating or syncing the native `android/` and `ios/` folders for a full React Native CLI runtime
- running Metro and an emulator or device

This repo intentionally does not execute the mobile app automatically.
