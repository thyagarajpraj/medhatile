# API Contract

Base URL: `http://localhost:4000/api`

## GET /health
Response:
```json
{ "status": "ok" }
```

## GET /levels
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

## GET /pattern
Request:
```txt
/pattern?gridSize=4&count=3
```

Response:
```json
{ "pattern": [0, 5, 9] }
```

Validation:
- `gridSize` must be positive integer.
- `count` must be positive integer.
- `count <= gridSize * gridSize`.
- Return 400 for invalid input.

