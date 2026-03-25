# API Contract

Base URL (local): `http://127.0.0.1:5000/api`

Auth:
- Protected routes require `Authorization: Bearer <token>`.
- Only `GET /health` and `GET /api/health` remain public.

## POST /api/auth/register
Request:
```json
{ "email": "user@example.com", "password": "password123" }
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "bestScore": 0
  }
}
```

Validation:
- `email` must be valid.
- `password` must be at least 8 characters.
- Duplicate emails return `409`.

## POST /api/auth/login
Request:
```json
{ "email": "user@example.com", "password": "password123" }
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "bestScore": 7
  }
}
```

Validation and errors:
- Invalid credentials return `401`.

## GET /api/auth/me
Response:
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "bestScore": 7
  }
}
```

Validation and errors:
- Missing or invalid token returns `401`.

## GET /health
Response body:
```txt
OK
```

## GET /api/health
Response:
```json
{ "status": "ok" }
```

## GET /api/game/levels
Response:
```json
{
  "levels": [
    { "level": 1, "grid": 4, "tiles": 3 },
    { "level": 2, "grid": 4, "tiles": 4 },
    { "level": 3, "grid": 6, "tiles": 5 },
    { "level": 4, "grid": 6, "tiles": 6 },
    { "level": 5, "grid": 8, "tiles": 7 }
  ]
}
```

Validation:
- Requires a valid bearer token.

## GET /api/game/config
Response:
```json
{ "roundsPerLevel": 5 }
```

Validation:
- `roundsPerLevel` is a positive integer controlled by backend env (`ROUNDS_PER_LEVEL`).
- Requires a valid bearer token.

## GET /api/game/pattern
Request:
```txt
/api/game/pattern?gridSize=4&count=3
```

Response:
```json
{ "pattern": [0, 5, 9] }
```

Validation:
- Requires a valid bearer token.
- `gridSize` must be a positive integer.
- `count` must be a positive integer.
- `count <= gridSize * gridSize`.
- Return HTTP 400 on invalid input.

Error response shape:
```json
{ "error": "Invalid gridSize or count" }
```

## POST /api/game/submit
Request:
```json
{ "score": 7, "level": 8 }
```

Success response:
```json
{ "success": true, "message": "Score received", "bestScore": 7 }
```

Validation:
- `score` must be an integer >= 0.
- `level` must be an integer > 0.
- Requires a valid bearer token.

Error response shape:
```json
{ "success": false, "message": "Invalid score payload" }
```

## POST /api/game/best-score/sync
Request:
```json
{ "bestScore": 7 }
```

Response:
```json
{ "success": true, "bestScore": 7 }
```

Validation:
- `bestScore` must be an integer >= 0.
- Requires a valid bearer token.

## Movies CRUD
Base paths:
- `GET|POST /api/movies`
- `GET|PUT|DELETE /api/movies/:id`

### GET /api/movies
Query params:
- `page` (optional positive integer, default `1`)
- `limit` (optional positive integer, default `12`, max `50`)
- `title` (optional string, case-insensitive title filter)

Response:
```json
{
  "movies": [
    {
      "_id": "69a6ee2c92eb104a10008604",
      "title": "Example",
      "year": 2026,
      "plot": "CRUD probe movie",
      "genres": ["Test"]
    }
  ],
  "page": 1,
  "limit": 12,
  "total": 1
}
```

Validation:
- Requires a valid bearer token.

### GET /api/movies/:id
Response:
```json
{
  "movie": {
    "_id": "69a6ee2c92eb104a10008604",
    "title": "Example",
    "year": 2026,
    "plot": "CRUD probe movie",
    "genres": ["Test"]
  }
}
```

Validation:
- Requires a valid bearer token.

### POST /api/movies
Request:
```json
{
  "title": "Example",
  "year": 2026,
  "plot": "CRUD probe movie",
  "genres": ["Test"]
}
```

Response:
- `201` with `{ "movie": { ... } }`

Validation:
- Requires a valid bearer token.

### PUT /api/movies/:id
Request:
```json
{
  "title": "Example Updated",
  "genres": ["Test", "Updated"]
}
```

Response:
- `200` with `{ "movie": { ...updated fields... } }`

Validation:
- Requires a valid bearer token.

### DELETE /api/movies/:id
Response:
```json
{ "deleted": true, "id": "69a6ee2c92eb104a10008604" }
```

Validation and errors:
- Requires a valid bearer token.
- Invalid `:id` returns `400` with `{ "error": "Invalid movie id" }`
- Missing resource returns `404` with `{ "error": "Movie not found" }`
