# Spec 0024: Microsoft Graph OAuth

- **Status:** draft
- **Phase:** F3
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
To read Teams meetings, calendar, Todo — natural integrations.

## Scope

### In
- OAuth 2.0 authorization code + PKCE via localhost loopback
- Minimum scopes per feature (`Calendars.Read`, `Tasks.ReadWrite`,
  `OnlineMeetings.Read`)
- Refresh token stored in the OS keyring (never on disk in plain
  text)

### Out
- Teams recording via Graph → not bot-less, keep local capture
- Enterprise multi-tenant setup → F4+

## Behavior (acceptance)
- Flow: "Connect Microsoft" button → browser opens → local callback
  → token stored
- Revoke: remove the keyring entry + call the `revoke` endpoint

## Open questions
- AAD app registration: single-tenant (personal) or multi-tenant?
- Minimum vs bundled scopes: ask granularly
