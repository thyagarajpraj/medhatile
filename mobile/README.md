# MedhaTile Mobile

This folder contains the React Native CLI app shell for the mobile MedhaTile experience.

Current runtime note:
- `src/App.tsx` is the stable mobile entrypoint and now renders the full app through `src/AppMain.tsx`
- `src/AppDummy.tsx` remains available as a local health-check screen when you need to isolate rendering or Metro issues without hitting the live app flow
- the local scripts repair pnpm-specific React Native dependency resolution before Metro or Android commands run

What is ready in the current foundation milestone:
- shared API wiring through `shared/api`
- shared 2048 logic through `shared/game`
- modular mobile auth flow with login and register
- `Confirm Password` validation for register
- AsyncStorage-backed session persistence
- session revalidation against `GET /api/auth/me` before opening authenticated screens
- standard React Native CLI scaffold for Metro plus native `android/` and `ios/` projects
- stable React Native Android architecture enabled by default so local builds do not require a working NDK install
- a mobile choose-game landing screen
- dedicated mobile screens for `2048` and leaderboard

What is intentionally deferred to the next milestone:
- the mobile `Identifying Tiles` game flow
- device-specific polish after the memory game is added

What still needs a local machine step:
- installing workspace dependencies from the repo root with `npm run setup`
- running Metro and an emulator or device
- on macOS, running `bundle install` and `bundle exec pod install` inside `ios/` before `npm run ios`

Helpful local commands:
- `npm run dev` requires port `8081` to be free, then starts Metro with a clean cache before installing and launching Android
- `npm run start` requires port `8081` to be free, then starts Metro with a clean cache
- `npm run android` installs and launches Android only

This repo intentionally does not execute the mobile app automatically outside those explicit local commands.
