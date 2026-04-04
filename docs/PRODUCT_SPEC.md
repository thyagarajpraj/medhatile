# Product Spec: MedhaTile

## Vision
A minimal cognitive training web app for memory and focus using timed tile recall.

## App Sections
- Password auth gate shown before the app shell.
- `Choose Game` section mounted at `/`.
- `2048` game mounted at `/games/adding`.
- `Identifying Tiles` game mounted at `/games/identifying`.
- `Leaderboard` mounted at `/leaderboard`.
- Protected in-app screens expose a top-right game dropdown for switching between available games.
- The identifying-tiles route renders its own live-style header while still sharing the same authenticated session state.

## Authentication
- Email/password registration and sign-in are required before app access.
- Register screen includes `Confirm Password` and blocks submit when it does not match.
- Session is stored in localStorage and restored on reload when valid.
- Stored sessions are validated against `GET /api/auth/me` before protected UI is trusted.
- All non-health app APIs require a bearer token.
- Best score remains in localStorage and syncs to the signed-in account, using the higher value for display.

## Game Flow
1. User selects a difficulty mode and taps Start Training.
2. App reveals a pattern in blue tiles for 1 second.
3. User recalls and taps tiles.
4. Correct taps are tracked; wrong taps increase mistakes.
5. At 3 mistakes, app enters a review phase showing the full answer.
6. Correct-answer tiles blink for 1 second during review.
7. App restarts the same round after review.
8. If user completes a round before 3 mistakes, the next round increases tile count.

## Phases
```ts
type Phase = "idle" | "reveal" | "recall" | "review";
```

## Core State
```ts
type GameState = {
  level: number;
  gridSize: number;
  tilesToRemember: number;
  pattern: number[];
  userSelections: number[];
  mistakes: number;
  phase: Phase;
  score: number;
};
```

## Difficulty Modes
- Easy: `grid=4`, `startTiles=3`, `maxTiles=10`
- Medium: `grid=6`, `startTiles=4`, `maxTiles=14`
- Hard: `grid=8`, `startTiles=5`, `maxTiles=20`

## Visual Rules
- Background: neutral gradient around `#F8F9FA`
- Default tile: light gray
- Reveal tile: blue
- Clicked correct: blue with `OK`
- Missed correct (review): violet with `.`
- Wrong click: red with `X`
- Rounded corners and minimal motion

## Success Criteria
- Reveal remains visible for full 1 second.
- Round transitions are stable and no stale timer leaks.
- Review blink remains visible for full 1 second after max mistakes.
- Mobile layout is usable without clipped core controls.
- Login/register gate is usable on mobile widths without clipped inputs or buttons.
- In mobile gameplay layout, tile stats/answer panel is rendered below the tile board.
- Tile Progress shows blue-tile, correct, remaining, and mistakes counters together.
- Header controls remain usable on mobile widths, including sign out and the game dropdown.
- Best score survives page reload.
- The choose-game flow preserves access to both the 2048 and identifying-tiles games.
- The identifying-tiles route exposes ARIA labels for key controls and announces loading/phase changes politely.

## Code Documentation
- All declared functions in `web/src` and `backend/src` include JSDoc comments.

