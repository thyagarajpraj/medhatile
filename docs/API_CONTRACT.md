# API Contract

Base URL: `http://localhost:5000`

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

## GET /api/game/config
Response:
```json
{ "roundsPerLevel": 5 }
```

Validation:
- `roundsPerLevel` is a positive integer controlled by backend env (`ROUNDS_PER_LEVEL`).

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
{ "success": true, "message": "Score received" }
```

Validation:
- `score` must be an integer >= 0.
- `level` must be an integer > 0.

Error response shape:
```json
{ "success": false, "message": "Invalid score payload" }
```
