# Product Spec: MedhaTile

## Vision
A minimal cognitive training web app for memory and focus using timed tile recall.

## Game Flow
1. User selects a difficulty mode and taps Start Training.
2. App reveals a pattern in blue tiles for 3 seconds.
3. User recalls and taps tiles.
4. Correct taps are tracked; wrong taps increase mistakes.
5. At 3 mistakes, app enters a review phase showing the full answer.
6. User taps Next to open game over modal and restart.
7. If user completes a round before 3 mistakes, the next round increases tile count.

## Phases
```ts
type Phase = "idle" | "reveal" | "recall" | "review" | "gameover";
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
- Reveal remains visible for full 3 seconds.
- Round transitions are stable and no stale timer leaks.
- Mobile layout is usable without clipped core controls.
- Best score survives page reload.

