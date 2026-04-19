# Spec 0035: Pre-meeting briefing

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0024, spec 0032, spec 0034
- **Relevant ADRs:** —

## Why
5 minutes before the meeting: "you spoke to this person about X,
agreed on Y, open topics Z".

## Scope

### In
- Trigger: "meeting in 5 minutes" event (from calendar sync)
- Vault RAG keyed on participants + context
- Notification with a clickable summary → opens preview

### Out
- Email briefing → F5
