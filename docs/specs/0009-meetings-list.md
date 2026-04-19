# Spec 0009: Meetings list view

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0007 (recording), spec 0008 (meeting pipeline)
- **Relevant ADRs:** —

## Why
Once the meeting pipeline produces a recording, transcript, and
summary, the user needs a place to browse past meetings, play
back audio, re-read transcripts, and link a meeting to the note
it inspired. Today `App.tsx` has an inline placeholder — it's
not a real view.

## Scope

### In
- List grouped by day, newest first
- Each row: title, time, duration, participants (when present),
  flags for `has_transcript` / `has_summary`
- Click opens a detail pane with:
  - Audio player (seeks to transcript segment)
  - Transcript with speaker labels (read-only in F1)
  - Summary (rendered markdown)
  - "Open related note" if any note references the meeting
- Search by participant name or text in the transcript
- Soft-delete: move the meeting folder under
  `~/coxinha/.trash/meetings/<id>/` and drop the DB row

### Out
- Transcript editing → F1.5+
- Multi-device playback position sync → F2 (depends on sync backend)
- Re-recording over an existing meeting

## Behavior (acceptance)
- **Empty state** when no meetings yet, with a CTA pointing at
  call detection (spec 0007) and the manual recording shortcut
- **New meeting** appears at the top immediately after
  `stop_recording`
- **Playing audio:** the current segment is highlighted in the
  transcript; clicking a segment seeks the player
- **Search** narrows the list live (debounced 150ms)
- **Soft delete:** prompt, then meeting vanishes from the list;
  the folder ends up in `.trash/`; hard-purge is a separate
  Settings action (spec 0010)

## Design notes
- Backend commands: `list_meetings`, `get_meeting` (exist);
  `delete_meeting(id)` (new)
- Frontend: `src/components/MeetingsList.tsx` + a detail panel
  (inline side-by-side on wide layouts, stacked on narrow)
- Audio served via the `coxinha://` asset protocol (already
  referenced by `NoteEditor` for attachments)
- All strings live in `src/locales/en.json` under `meetings.*`

## Open questions
- Show transcript highlighting using wavesurfer.js or a plain
  `<audio>` + scroll-to segment? Start with plain.
- Soft delete retention: purge after N days? 30 is a sane default.
