# ADR-0006: Cargo workspace for the monorepo

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Eventually we will have `src-tauri/` (app) + `backend/` (F2 sync
server) + `shared/` (shared types).

## Decision
Cargo workspace at the repo root. Start with `src-tauri/` and
`shared/`. Add `backend/` in F2 without refactoring.

## Consequences
- **+** One `target/`, one `Cargo.lock`, incremental cross-crate builds
- **+** `Meeting`, `Note`, etc. live in `shared/`, no duplication
- **−** The frontend sits outside the workspace (pnpm manages it)
