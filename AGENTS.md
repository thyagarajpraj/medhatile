# MedhaTile Agent Setup

## Purpose
Use a simple 2-agent flow to build fast while keeping quality high.

## Agent Roles
### 1) Builder Agent
Scope:
- Read `docs/PROJECT_STATUS_AND_RULES.md` before changing behavior, process, release, or deployment docs.
- Implement features from `docs/PRODUCT_SPEC.md`
- Follow API behavior in `docs/API_CONTRACT.md`
- Execute steps in `docs/IMPLEMENTATION_STEPS.md`
- Stay within scope boundaries listed in `docs/PROJECT_STATUS_AND_RULES.md`

Must do:
- Keep frontend and backend modular
- Keep UI minimal and mobile responsive
- Run `npm run build` at repo root before handoff

### 2) Reviewer Agent
Scope:
- Review changes for bugs, regressions, and missing requirements
- Validate against `docs/QA_CHECKLIST.md`
- Report findings ordered by severity

Must do:
- Prioritize defects over style preferences
- Call out missing tests or unverified behavior
- Approve only when checklist is satisfied

## Working Agreement
- Existing auth, leaderboard, and MongoDB-backed features are in scope because they are documented in the product and API docs.
- Do not add out-of-scope features such as payments, ads, AI, streaks, social feeds, public profiles, subscriptions, undocumented game modes, or new persistent data domains.
- Do not change difficulty progression or game phase model.
- Keep API contract stable unless explicitly approved.

## Agent Rules (Required)
1. Source of truth order:
- `docs/PRODUCT_SPEC.md` -> behavior and UX intent
- `docs/API_CONTRACT.md` -> backend response shape and validation
- `docs/QA_CHECKLIST.md` -> acceptance criteria
- `docs/IMPLEMENTATION_STEPS.md` -> delivery order
- `docs/PROJECT_STATUS_AND_RULES.md` -> current status, scope boundaries, and quality gates

2. Scope control:
- No speculative features.
- No hidden refactors outside touched modules.
- No dependency additions unless required for the current milestone.

3. Change discipline:
- Keep changes small and milestone-based.
- Update docs when behavior or setup changes.
- Preserve folder structure and naming conventions in repo docs.
- Remove or clearly mark stale docs when active routes, release readiness, or deployment status changes.

4. Quality gate before handoff:
- Run `npm run build` at repo root.
- Confirm no TypeScript errors.
- Confirm backend endpoints required by contract still work.
- State every relevant check that was not run.

5. Reviewer reporting format:
- Findings first, ordered by severity.
- Each finding must include file path and concrete impact.
- If no findings, state residual risks and untested paths.

6. Communication rules:
- Explicitly state assumptions.
- Flag blockers immediately with exact missing input.
- Do not mark complete if any checklist item is unverified.

## Handoff Inputs
Builder receives:
- `AGENT_PROMPT.md`
- `docs/PRODUCT_SPEC.md`
- `docs/API_CONTRACT.md`
- `docs/IMPLEMENTATION_STEPS.md`

Reviewer receives:
- Builder diff/summary
- `docs/QA_CHECKLIST.md`
- `docs/PRODUCT_SPEC.md`
- `docs/API_CONTRACT.md`

## Suggested Sequence
1. Builder implements one milestone at a time.
2. Builder runs `npm run build`.
3. Reviewer audits against checklist and contract.
4. Builder fixes findings.
5. Reviewer signs off.

## Copy-Paste Prompts
### Builder Prompt
Build MedhaTile using `AGENT_PROMPT.md` and all docs in `docs/`. Keep scope strict, run root build, and return a concise change summary with file paths.

### Reviewer Prompt
Review the implementation against `docs/QA_CHECKLIST.md`, `docs/PRODUCT_SPEC.md`, and `docs/API_CONTRACT.md`. List findings first by severity with exact file references; include residual risks if no findings.

## Definition of Done
- Functional checklist passes in `docs/QA_CHECKLIST.md`
- Backend endpoints behave per `docs/API_CONTRACT.md`
- Root build passes: `npm run build`
- No out-of-scope features introduced
- Unverified checks and residual risks are explicitly documented
