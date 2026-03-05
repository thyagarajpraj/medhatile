# API Contract

Base URL: `http://127.0.0.1:5000/api`

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
- `gridSize` must be a positive integer.
- `count` must be a positive integer.
- `count <= gridSize * gridSize`.
- Return HTTP 400 on invalid input.

Error response shape:
```json
{ "error": "Invalid gridSize or count" }
```

## Movies CRUD
Base path: `GET|POST /api/movies`, `GET|PUT|DELETE /api/movies/:id`

### GET /movies
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

### GET /movies/:id
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

### POST /movies
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

### PUT /movies/:id
Request:
```json
{
  "title": "Example Updated",
  "genres": ["Test", "Updated"]
}
```

Response:
- `200` with `{ "movie": { ...updated fields... } }`

### DELETE /movies/:id
Response:
```json
{ "deleted": true, "id": "69a6ee2c92eb104a10008604" }
```

Validation and errors:
- Invalid `:id` returns `400` with `{ "error": "Invalid movie id" }`
- Missing resource returns `404` with `{ "error": "Movie not found" }`

