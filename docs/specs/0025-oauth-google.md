# Spec 0025: Google Calendar/Tasks OAuth

- **Status:** draft
- **Phase:** F3
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
Same motivation as Microsoft, other ecosystem.

## Scope

### In
- OAuth 2 + PKCE via loopback
- Scopes `calendar.readonly`, `tasks` (read/write optional)
- Keyring for the refresh token

### Out
- Gmail read/write → F4+

## Behavior (acceptance)
- Same visible flow as spec 0024, different provider
