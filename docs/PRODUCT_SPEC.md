# Product Spec: MedhaTile

## Vision
A minimal cognitive training web app for memory and focus using timed tile recall.

## App Sections
- Password auth gate shown before the app shell in all modes
- `Game` section mounted at `/`
- `Movies` section mounted at `/movies`
- Development mode (`import.meta.env.DEV`):
  - top navigation exposes a visible `Movies` link after sign-in
  - switching between `/` and `/movies` happens without full-page refresh
- Production mode (`import.meta.env.PROD`):
  - app renders only the game view after sign-in
  - top navigation/header is hidden

## Authentication
- Email/password registration and sign-in are required before app access.
- Register screen includes `Confirm Password` and blocks submit when it does not match.
- Session is stored in localStorage and restored on reload when valid.
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
- Best score survives page reload.
- In development mode, `/movies` route loads after auth and can perform list/create/update/delete against backend `/api/movies` endpoints.

## Code Documentation
- All declared functions in frontend/backend source include JSDoc comments.

