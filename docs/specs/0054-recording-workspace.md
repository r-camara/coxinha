# Spec 0054 — Recording workspace (live transcript + AI notes)

Status: draft (2026-04-21)
Depends on: 0007 (recording), 0008 (transcription + diarization),
0051 (AI assistant panel)
Relates to: Page 6 of the Mix B Refined mockup
(`docs/ui/new-options.pen`)

## Motivation

Today hitting "Gravar e transcrever" captures audio to disk but
the user has no real-time surface — they have to wait for the
post-roll summary. The Mix B Refined handoff makes the recording
state a **dedicated workspace** where the user can see
transcription + AI notes as they happen.

## Surface

Replaces the editor while `recorder.state == 'recording'`:

- **Recording bar** (top, full width, 48 px)
  - Left: orange "● Gravando · {meeting title}"
  - Center: timer (`00:14:32`, mono) + 12-bar live waveform
  - Right: Pause / Parar buttons, microphone device indicator
    (`MacBook Pro Mic`)
- **Transcript column** (center, flex)
  - Speaker-labeled turns with timestamps (`Rafa · 00:14:21`)
  - Current-decision highlight: last turn from the speaker flagged
    by the AI as carrying a decision gets a soft tangerine left
    border + muted background
  - Sticky "live scroll" toggle at the bottom — auto-scrolls
    unless the user scrolls up
- **AI live-notes rail** (right, 320 px — same footprint as the
  AI panel from spec 0051)
  - Eyebrow: "Notas ao vivo · gravando"
  - Sections (each expands/collapses):
    - DECISÕES (checkbox list the AI marks as it detects them)
    - PRÓXIMAS AÇÕES (action items with optional @-assignees)
    - PERGUNTAS ABERTAS (things the group flagged but didn't
      resolve)
  - Bottom row: "Salvar como nota" primary + status text ("áudio
    + transcrição salvos · nada enviado")

## Behavior

- The ChromeBar from spec 0052 stays mounted but switches its
  breadcrumb to `meetings / {title}` and its right-slot to a
  larger orange pulse dot with the word "Gravando".
- The IconRail and AI rail from spec 0052 stay in place. Hitting
  the mic icon while recording surfaces a "Parar" confirmation.
- Pause suspends the audio chunker (spec 0007) and the diarizer
  (spec 0008); resume continues the same file.
- Parar writes the final meeting record and navigates the user
  to the newly-created meeting detail route (spec 0008). The
  in-flight AI sections become the initial note body.
- If the OS reports microphone disconnection mid-recording, the
  workspace freezes the timer and shows an inline banner
  ("Microfone desconectado — áudio preservado até aqui"). No
  silent data loss.

## Gating

- Only reachable when `recorder.state == 'recording'`. Direct
  navigation to `/meetings/$id?record` without an active
  recording redirects to the detail route.

## AI integration

- AI live-notes pull from the same streaming pipeline that
  post-roll uses (spec 0008 summarizer). The difference is
  incremental rendering: on each new transcript chunk, the
  summarizer is re-invoked with a stateful prompt that updates
  the existing sections.
- Sections stay stable (user can interact with their checkboxes);
  the AI can only append new rows or revise unpinned ones.

## Out of scope

- Multi-party remote transcription (F3+).
- Speaker-embedding enrollment UI (today's Pyannote + Speakrs
  engines work with label-only output).

## Acceptance

- [ ] Workspace renders in light + dark; matches the Mix B
  Refined Page 6 mockup.
- [ ] Transcript auto-scrolls until the user scrolls up; the
  "jump to live" pill re-arms auto-scroll.
- [ ] AI section updates respect user-checked items (no
  regression when the LLM emits a reordered pass).
- [ ] Parar writes the meeting record with the live-note sections
  inlined into the initial markdown; the new route mounts
  without a second IPC roundtrip.
- [ ] Mic-disconnect branch preserves the in-flight audio on
  disk even if Pause wasn't hit first.
