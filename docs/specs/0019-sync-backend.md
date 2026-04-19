# Spec 0019: Sync backend (Axum + Postgres)

- **Status:** draft
- **Phase:** F2
- **Owner:** Rodolfo
- **Depends on:** spec 0005
- **Relevant ADRs:** ADR-0002, ADR-0006

## Why
Multi-PC. A note written on the laptop should appear on the
desktop.

## Scope

### In
- New `backend/` crate in the workspace (Axum + sqlx + Postgres)
- Endpoints:
  - `POST /notes/:id` (upsert with etag/vector clock)
  - `GET /notes/since/:timestamp`
  - `WS /sync` (realtime push)
- Migrations under `backend/migrations/`
- docker-compose for dev

### Out
- Sync client → spec 0020
- CRDT → spec 0021
- Auth → spec 0023

## Behavior (acceptance)
- POST a note → GET round-trip returns the same note
- Two concurrent requests do not corrupt state
- Schema migrates from the previous version without data loss

## Design notes
- Postgres is source of truth on the server; the client keeps a
  replica
- The filesystem remains canonical on the client (user can edit
  offline)

## Open questions
- Self-hosted only or also SaaS? Start self-hosted
- Attachment storage: Postgres blob (LOB) vs S3/MinIO
