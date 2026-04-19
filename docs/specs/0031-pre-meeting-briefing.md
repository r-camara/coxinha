# Spec 0031: Pre-meeting briefing

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0020, spec 0028, spec 0030
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
