# Product Spec: MedhaTile

## Vision
A minimal cognitive training web app that improves memory and focus through tile pattern recall.

## Primary User Loop
1. User opens app and taps Start Training.
2. App reveals a tile pattern for 3 seconds.
3. User recalls and taps matching tiles.
4. Correct selections continue; wrong selections add mistakes.
5. 3 mistakes ends run.
6. Successful round increases difficulty.

## Phases
```ts
type Phase = "idle" | "reveal" | "recall" | "gameover";
```

## Core State
```ts
type GameState = {
  level: number;
  gridSize: number;
  pattern: number[];
  userSelections: number[];
  mistakes: number;
  phase: Phase;
  score: number;
};
```

## Visual Rules
- Background: #F8F9FA (or subtle neutral gradient)
- Default tile: light gray
- Reveal tile: blue
- Correct tile: green
- Wrong tile: red
- Rounded corners
- Minimal animation

## Success Criteria
- Game loop runs without phase bugs.
- Difficulty feels progressive.
- Mobile layout is usable.
- Replay value is good.
