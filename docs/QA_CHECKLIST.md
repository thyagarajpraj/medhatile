# QA Checklist

## Functional
- Start button begins round.
- Reveal phase lasts 3 seconds.
- Only reveal tiles are blue during reveal phase.
- Correct taps become green.
- Wrong taps become red.
- Third mistake triggers game over.
- Round success increments score and advances difficulty.
- Best score persists after reload.

## API
- `/api/health` returns status ok.
- `/api/levels` returns 5 configured levels.
- `/api/pattern` returns unique indices and correct count.
- Invalid `/api/pattern` inputs return HTTP 400.

## Build
- `backend`: `npm run build` passes.
- `frontend`: `npm run build` passes.

## UX
- Board and controls usable on mobile width.
- Colors and states are clear.
- No flashy visual effects.

