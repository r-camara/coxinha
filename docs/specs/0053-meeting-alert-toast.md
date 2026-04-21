# Spec 0053 — Meeting-alert toast (2-minute heads-up)

Status: draft (2026-04-21)
Depends on: 0007 (recording), 0008 (transcription), a future
calendar-ingest spec
Relates to: Page 5 of the Mix B Refined mockup
(`docs/ui/new-options.pen`)

## Motivation

The Mix B Refined handoff introduces a 2-minute heads-up toast
that fires when the user has a meeting about to start. Today the
user has to remember to hit `Ctrl+Alt+W` or open the tray to start
recording — the app misses most meetings silently.

## Surface

Top-right corner, ~420 px wide, elevated card with:

- Eyebrow: "REUNIÃO EM 2 MINUTOS" (tangerine)
- Title: meeting name (38 px? — smaller, maybe 20 px bold)
- Metadata row: `HH:MM – HH:MM · Google Meet · N pessoas`
- Avatar cluster (up to 3 initials) + overflow text
  ("Rafa, Marina, Luís e você")
- Body: "Quer que a Coxinha grave e transcreva localmente? Você
  recebe uma nota pronta ao final."
- Primary button: "● Gravar e transcrever" (tangerine)
- Secondary text button: "Agora não"
- Tertiary inline row: "Criar nota vazia da reunião" (subtle),
  "lembrar em 2 min" (right-aligned)
- Footer privacy line: "🔒 tudo local · nada sai do seu
  computador" with a "ajustar alertas" text button

## Behavior

- Fires 2 min before the event `start`. Honors OS `reduce motion`
  (fade in / out instead of slide).
- Dismissible via Esc or the secondary button; "lembrar em 2 min"
  re-arms the toast after 2 min.
- Clicking the primary CTA immediately starts the recorder (spec
  0007) and opens the recording workspace (future spec 0054).
- Silent if Coxinha is focused inside a tray-minimized state —
  the OS notification takes over (see ADR-0007).

## Gating

- Only fires when (a) calendar integration is configured, (b)
  the event has a detectable video-conferencing link, and (c)
  the event `start` is ≤ 2 min away.
- Skipped when the user is already in an active recording for a
  different meeting.

## Data

- Needs a local representation of the next-upcoming event. The
  calendar-ingest spec (TBD) will populate this; until then the
  toast stays behind a feature flag.

## Out of scope (for this spec)

- Calendar ingestion mechanism (OAuth vs ICS polling).
- In-toast participant editing / "add me to the meeting" flows.
- Multi-monitor toast positioning — OS decides placement.

## Acceptance

- [ ] Toast renders in light + dark with the tokens from spec
  0052; matches the Mix B Refined Page 5 mockup.
- [ ] Primary CTA kicks the recorder through the spec-0007 API
  path.
- [ ] "Lembrar em 2 min" re-arms correctly without duplicate
  toasts when the user dismisses and re-snoozes twice.
- [ ] Unit test: gating matrix (no calendar, no link, already
  recording, < 2 min window, > 2 min window).
