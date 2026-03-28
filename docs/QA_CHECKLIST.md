# QA Checklist

## Functional
- Login/register gate appears before the app shell.
- Register mode shows `Confirm Password`.
- Confirm Password mismatch blocks registration submit.
- Session restores after reload when token is valid.
- Sign out returns to the auth gate.
- Start screen shows mode selector and start button.
- In development mode, top navigation includes a `Movies` link after sign-in.
- In development mode, visiting `/movies` shows movies section UI after sign-in.
- In production mode, header/nav is hidden and only game view is shown after sign-in.
- Reveal phase lasts 1 second and shows only pattern tiles in blue.
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
- Best score syncs to the signed-in account and uses the higher local/account value.

## API
- `GET /health` returns `OK`.
- `GET /api/health` returns `{ "status": "ok" }`.
- `POST /api/auth/register` creates a password account.
- `POST /api/auth/login` returns a bearer token.
- `GET /api/auth/me` restores the current authenticated user.
- `GET /api/game/levels` returns configured level list.
- `GET /api/game/pattern` returns unique indices with requested count.
- `POST /api/game/submit` returns success for valid payload.
- `POST /api/game/best-score/sync` updates the account best score.
- Invalid `gridSize` or `count` returns HTTP 400.
- Unauthenticated app API calls return HTTP 401.
- `GET /api/movies` returns paginated movie list after auth.
- `POST /api/movies` creates a movie with valid payload after auth.
- `PUT /api/movies/:id` updates movie by id after auth.
- `DELETE /api/movies/:id` deletes movie by id after auth.

## Test and Build
- `frontend`: `npm run test` passes.
- `frontend`: `npm run build` passes.
- `backend`: `npm run build` passes.

## Code Documentation
- All declared functions in `frontend/src` and `backend/src` include JSDoc.
- JSDoc comments describe intent and expected behavior accurately.

## UX
- Auth screen is mobile friendly and shows only stacked controls on narrow widths.
- Tiles and side panel do not overlap.
- Tile board remains usable on mobile width.
- On mobile gameplay layout, tile board appears above tile-progress/review panel.
- Tile Progress panel shows mistakes alongside blue-tile, correct, and remaining counters.
- No unexpected page scroll that hides primary controls.
- Visual states are distinguishable (blue/violet/red markers).
