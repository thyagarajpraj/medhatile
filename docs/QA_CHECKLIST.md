# QA Checklist

## Functional
- Start screen shows mode selector and start button.
- Reveal phase lasts 3 seconds and shows only pattern tiles in blue.
- Recall accepts clicks only in recall phase.
- Wrong clicks increase mistake count.
- Third mistake switches phase to review.
- Review shows answer states clearly:
  - `OK` clicked correct
  - `.` missed correct
  - `X` wrong click
- After 3 mistakes, correct tiles blink for 1 second.
- Round automatically restarts after review blink.
- Back to Start returns to start screen.
- Best score persists after reload.

## API
- `GET /health` returns `OK`.
- `GET /api/health` returns `{ "status": "ok" }`.
- `GET /api/game/levels` returns configured level list.
- `GET /api/game/pattern` returns unique indices with requested count.
- `POST /api/game/submit` returns success for valid payload.
- Invalid `gridSize` or `count` returns HTTP 400.

## Test and Build
- `frontend`: `npm run test` passes.
- `frontend`: `npm run build` passes.
- `backend`: `npm run build` passes.

## Code Documentation
- All declared functions in `frontend/src` and `backend/src` include JSDoc.
- JSDoc comments describe intent and expected behavior accurately.

## UX
- Tiles and side panel do not overlap.
- Tile board remains usable on mobile width.
- No unexpected page scroll that hides primary controls.
- Visual states are distinguishable (blue/violet/red markers).
