# Spec 0023: GitHub PRs/issues sync

- **Status:** draft
- **Phase:** F3
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
Assigned PRs + review requests + mentioned issues feed into the
daily timeline.

## Scope

### In
- Personal access token (classic or fine-grained) in the keyring
- Pull `is:open is:pr review-requested:@me` + `assigned:@me`
- 10-minute refresh

### Out
- Commenting/merging via Coxinha → F4+
