# Deployment Analysis

**Audited:** 2026-06-29

## Current Deployment State

| Component | Target | Status |
|---|---|---|
| Backend API | Render Web Service | Pending (not yet deployed) |
| Web frontend | Vercel | Pending (not yet deployed) |
| Database | MongoDB Atlas | Connected locally; cluster credentials leaked (see W-01) |
| Mobile (Android) | Google Play Store | Pending — signing, Play Console, policy forms incomplete |
| Mobile (iOS) | Apple App Store | Not mentioned in any docs |

**As of June 11, 2026:** Only local development environment is operational. No production URLs exist.

---

## Backend — Render

### Configuration

`render.yaml` at repo root:

```yaml
services:
  - type: web
    name: medhatile-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_VERSION
        value: 20.19.0
      - key: FRONTEND_ORIGIN
        sync: false
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN_HOURS
        value: "24"
      - key: ROUNDS_PER_LEVEL
        value: "5"
      - key: DEBUG_HTTP
        value: "false"
```

### Issues with current Render config

| Issue | Impact |
|---|---|
| `buildCommand: npm install` | Uses npm in a pnpm project. Works in isolation because backend has its own `package-lock.json`, but is inconsistent with workspace tooling. |
| `MONGO_URI: sync: false` | Must be manually set in Render dashboard. There is no documented value. Credentials have been leaked to git. Must rotate before deploying. |
| `JWT_SECRET: sync: false` | Must be manually set. No rotation policy documented. |
| `FRONTEND_ORIGIN: sync: false` | Must be manually set to deployed Vercel URL after web deployment. Order of operations: deploy backend first, then web, then update `FRONTEND_ORIGIN`. |
| No `PORT` in envVars | Render injects `PORT` automatically. Backend must use `process.env.PORT`. This appears to be handled in `backend/src/lib/config.ts` but was not fully audited. |
| Health check path `/health` | Correctly configured to the plain-text health endpoint. |

### Pre-deploy checklist (backend)

- [ ] Rotate MongoDB Atlas password (leaked in `mongoDB Cred.txt`)
- [ ] Remove `mongoDB Cred.txt` from git history
- [ ] Set `MONGO_URI` in Render dashboard with new credentials
- [ ] Generate a strong `JWT_SECRET` (32+ random bytes)
- [ ] Set `JWT_SECRET` in Render dashboard
- [ ] Confirm backend `package-lock.json` is up-to-date for `npm install`
- [ ] Verify `GET /health` returns `200 OK` after deployment
- [ ] Verify `GET /api/health` returns `{ "status": "ok" }` after deployment

---

## Web Frontend — Vercel

No Vercel config file (`vercel.json`) exists in the repository. Deployment requires:

1. Connect Vercel to the GitHub repository
2. Set root directory to `web/`
3. Set build command to `pnpm run build` (or use Vercel's Next.js auto-detection)
4. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed Render backend URL

### Pre-deploy checklist (web)

- [ ] Backend must be deployed first (need the API URL)
- [ ] Add `vercel.json` to repo for reproducible config
- [ ] Set `NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com`
- [ ] Set `FRONTEND_ORIGIN` on Render to the Vercel URL (CORS)
- [ ] Verify auth gate works end-to-end against production API
- [ ] Verify game flow works with production pattern endpoint
- [ ] Verify score submission and leaderboard

---

## Mobile — Android

`docs/MOBILE_PLAYSTORE_RELEASE.md` contains a checklist. Key outstanding items:

- Release signing keystore: must be generated and stored securely (not in git)
- `versionCode` increment required before each Play Store upload
- Play Console setup: app listing, screenshots, privacy policy, Data safety form
- Content rating questionnaire
- Real-device testing (not emulator) required for Play Store policy compliance
- Signed `.aab` build: `./gradlew bundleRelease`

### Critical: Android signing config

`mobile/android/app/build.gradle` has release signing configuration referenced in a recent commit. The keystore file and signing passwords must NOT be committed. Verify `.gitignore` covers keystore files.

### iOS not documented

No iOS App Store release process is documented anywhere. If iOS release is a goal, documentation and an App Store Connect setup are needed.

---

## Environment Variables Summary

| Variable | Where Set | Required by |
|---|---|---|
| `MONGO_URI` | `backend/.env` (local) / Render dashboard (prod) | Backend |
| `JWT_SECRET` | `backend/.env` (local) / Render dashboard (prod) | Backend |
| `JWT_EXPIRES_IN_HOURS` | `render.yaml` (default: 24) | Backend |
| `ROUNDS_PER_LEVEL` | `render.yaml` (default: 5) | Backend |
| `FRONTEND_ORIGIN` | `render.yaml` / Render dashboard | Backend CORS |
| `DEBUG_HTTP` | `render.yaml` (default: false) | Backend logging |
| `NODE_ENV` | Injected by Render | Backend |
| `PORT` | Injected by Render | Backend |
| `NEXT_PUBLIC_API_BASE_URL` | `web/.env.production` / Vercel dashboard | Web |

### Env file status

- `.env.example` at root: exists, reviewed
- `web/.env.development`: tracked — contains `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000`
- `web/.env.production`: tracked — may contain a placeholder or real URL (not audited)
- `backend/.env.example`: exists
- `backend/.env`: should NOT be tracked (verify `.gitignore`)

---

## Missing Infrastructure

| Item | Status | Needed for |
|---|---|---|
| `vercel.json` | Missing | Reproducible web deployment |
| Docker / `docker-compose.yml` | Missing | Phase 12 |
| Staging environment | Missing | Pre-production validation |
| Monitoring / alerting | Missing | Production observability |
| Log aggregation | Missing | Production debugging |
| Database backups | Not documented | Data safety |
| CDN for static assets | Not configured | Performance (Phase 10) |
| Preview deployments | Not configured | PR review workflow |
