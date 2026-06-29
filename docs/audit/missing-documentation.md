# Missing Documentation Audit

**Audited:** 2026-06-29

## What Exists (Good)

| Document | Location | Quality |
|---|---|---|
| Product Spec | `docs/PRODUCT_SPEC.md` | Excellent — covers vision, game flow, state machine, difficulty modes, visual rules, success criteria |
| API Contract | `docs/API_CONTRACT.md` | Excellent — all endpoints with request/response shapes and validation rules |
| QA Checklist | `docs/QA_CHECKLIST.md` | Good — functional, API, build, UX, and documentation checks |
| Project Status & Rules | `docs/PROJECT_STATUS_AND_RULES.md` | Excellent — source-of-truth hierarchy, scope rules, change discipline |
| Deployment Status | `docs/DEPLOYMENT_STATUS.md` | Good — current state, deployment plan, known blockers |
| Implementation Steps | `docs/IMPLEMENTATION_STEPS.md` | Not read in detail — referenced in status docs |
| Mobile Play Store | `docs/MOBILE_PLAYSTORE_RELEASE.md` | Not read in detail — Android release checklist |
| Builder/Reviewer Workflow | `AGENTS.md` | Good — defines two-agent workflow |
| Agent Constraints | `AGENT_PROMPT.md` | Good — tech stack constraints, prohibited features |
| Monorepo Spec | `archives/MONOREPO_SPEC.md` | Historical — describes early scaffold, now superseded |

---

## What Is Missing

### Architecture

| Missing | Why It Matters |
|---|---|
| Architecture decision records (ADRs) | No record of *why* key decisions were made (pnpm over npm, Next.js App Router over Pages, Express over Next.js API routes, MongoDB over PostgreSQL). Future engineers will guess or undo good decisions. |
| System context diagram | No visual of how web, mobile, backend, and database relate |
| Data model documentation | No ERD or document schema for `User`, `LeaderboardEntry`, movies |
| API versioning policy | No strategy for `v1` vs `v2` when breaking changes come |
| Error handling strategy | No documented approach to error codes, error shapes, or client error handling |

### Development Process

| Missing | Why It Matters |
|---|---|
| Local setup guide | `README.md` describes the project but the exact steps to get a new dev running locally are not audited as complete |
| Git workflow guide | No documented branching strategy (trunk-based, feature branches, etc.), commit message format (Conventional Commits referenced in master prompt but not documented in repo), or PR process |
| Coding standards | No documented style guide (naming conventions, file organization, component patterns) beyond what ESLint enforces |
| Environment setup guide | No documented steps for getting `.env` files configured locally |

### Testing

| Missing | Why It Matters |
|---|---|
| Testing strategy | No documented approach: what to unit test vs integration test vs E2E, mocking policy, coverage targets per package |
| Mobile testing approach | No documented plan for mobile testing (manual, Detox, etc.) |
| Backend testing approach | Only one test file exists; no documented test patterns |

### Performance

| Missing | Why It Matters |
|---|---|
| Performance budget | No defined bundle size limits, LCP targets, or frame-rate targets for games |
| Rendering optimization guide | No documented patterns for avoiding rerenders in game loops |

### Accessibility

| Missing | Why It Matters |
|---|---|
| Accessibility standards | `PRODUCT_SPEC.md` mentions ARIA labels for identifying-tiles but no systematic a11y policy exists |
| Keyboard navigation spec | Which interactions must be keyboard-accessible? No documented answer |
| Screen reader support spec | What should a screen reader announce at each game phase? Not documented |

### Security

| Missing | Why It Matters |
|---|---|
| Security policy | No `SECURITY.md` — no vulnerability reporting process |
| Threat model | No documented threat model for the application |
| Secret management guide | No documented process for secret rotation, what goes in `.env`, what goes in the hosting dashboard |

### Game Design

| Missing | Why It Matters |
|---|---|
| Game design standards | Per the master prompt, every new game needs: PRD, Goals, HLD, LLD, algorithms, state diagrams, sequence diagrams, class diagrams. No template exists yet. |
| Game design template | Needed before Phase 6 (new games) |

### Package Documentation

| Missing | Why It Matters |
|---|---|
| `shared/game/README.md` | No README for the game logic package |
| `shared/api/README.md` | No README for the API client package |
| `shared/types/README.md` | No README for the types package |
| Package API docs | No JSDoc on shared package exports |
| Per-game README template | Template needed for 16+ games in Phase 6 |

### Contribution

| Missing | Why It Matters |
|---|---|
| `CONTRIBUTING.md` | No guide for contributors (how to open a PR, run tests, follow coding standards) |
| PR template (`.github/pull_request_template.md`) | No standard PR description format |
| Issue templates | No bug report or feature request templates |
| Review checklist | Per master prompt — a review checklist beyond `AGENTS.md` |

### AI Workflow

| Missing | Why It Matters |
|---|---|
| `.github/copilot-instructions.md` | GitHub Copilot context |
| `.github/instructions/coding.md` | Coding standards for AI agents |
| `.github/instructions/architecture.md` | Architecture guidance for AI agents |
| `.github/instructions/testing.md` | Testing approach for AI agents |
| `.github/instructions/react.md` | React patterns for AI agents |
| `.github/instructions/typescript.md` | TypeScript patterns for AI agents |
| `.github/instructions/game-development.md` | Game dev patterns for AI agents |
| Prompt library | Reusable prompts for Claude Code, Copilot, Cursor, Aider |

---

## Priority Order for Phase 2

1. **Architecture** — ADRs for decisions already made, system context diagram, data model
2. **Git workflow + coding standards** — needed before any Phase 3 restructure PRs
3. **Local setup guide** — needed for any new contributor
4. **Testing strategy** — needed before Phase 9
5. **Security policy + secret management** — needed immediately given W-01
6. **Package READMEs** — needed before Phase 4
7. **Game design template** — needed before Phase 6
8. **AI instructions** (`.github/instructions/`) — needed to guide future agent work
9. **Contribution guide + PR template** — needed before open-source or team work
10. **Accessibility standards** — needed before Phase 11
