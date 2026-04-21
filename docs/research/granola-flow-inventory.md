# Granola UX inventory

Public sources only. Dated 2026-04-20.

## 1. Product positioning

Granola is "the AI notepad for back-to-back meetings" — a local
audio-capturing notepad that **enhances your typed notes** instead of
replacing them with a bot-generated transcript summary. It captures
device audio directly (no bot joins, no "recording" banner) and, after
the meeting, weaves your rough notes with transcript context into an
"enhanced" document
([granola.ai](https://www.granola.ai/),
[Google Meet integration](https://www.granola.ai/blog/granola-google-meet-integration-recording-transcription)).
That "jot + enhance" pairing is the differentiator vs Otter
(transcript-first), Fathom (bot-in-the-call recorder), and Notion AI
(document assistant, no meeting capture) — Granola keeps the human in
the loop during the call and auto-finishes the doc after
([Zapier overview](https://zapier.com/blog/granola-ai/),
[BusinessWire launch](https://www.businesswire.com/news/home/20240522650474/en/Introducing-Granola-The-AI-Notepad-That-Enhances-Not-Replaces-Your-Thinking-In-Meetings)).

## 2. Pre-meeting / meeting detection

- **Calendar is the primary detector.** Google or Microsoft/Outlook
  sign-in on setup; Granola pulls title, time, attendees
  ([Calendar setup](https://www.granola.ai/docs/docs/101/gettingstarted/calendarintegrations)).
- **No window detection, no auto-join.** Granola does not auto-start
  recording and never attaches as a meeting bot; it listens to
  system + mic audio locally
  ([Google Meet setup](https://www.granola.ai/blog/granola-google-meet-integration-recording-transcription),
  [tl;dv review](https://tldv.io/blog/granola-review/)).
- **Reminder fires one minute before** any scheduled call with 2+
  attendees
  ([Calendar setup](https://www.granola.ai/docs/docs/101/gettingstarted/calendarintegrations)).
- **Tray/menubar icon:** lowercase **"g"** in the macOS menu bar /
  Windows system tray; primary entry point
  ([Wonder Tools](https://wondertools.substack.com/p/granolaguide),
  [Granola 101](https://docs.granola.ai/help-center/getting-started/granola-101)).
- **Pre-meeting "prep" surface:** a note page is auto-created from
  calendar metadata before the meeting so the user can jot prep
  thoughts; a "Prep next meeting" Recipe surfaces prior conversations
  with the attendee
  ([Granola 101](https://docs.granola.ai/help-center/getting-started/granola-101),
  [Recipes launch](https://www.granola.ai/updates)).
  A distinct "briefing" screen layout is `[unverified]` — sources
  describe content, not a separate view.
- **Starting recording:** user clicks **Start** on the auto-created
  note; iOS adds one-tap Lock-Screen capture
  ([App Store listing](https://apps.apple.com/us/app/granola-ai-meeting-notes/id6739429409)).
  Global hotkey is `[unverified]`.

## 3. During the meeting

- **Blank-canvas notepad is the primary surface.** UI mimics Apple
  Notes / Google Docs; window chrome fades on typing
  ([Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
- **Hand-written notes during the meeting:** yes — the core loop.
  Whatever you type flows into the same note that will later be
  enhanced; no separate scratch pad
  ([granola.ai](https://www.granola.ai/),
  [AI-enhanced notes](https://help.granola.ai/article/ai-enhanced-notes)).
- **Live transcript hidden by default**, revealed by a toggle/tab at
  the bottom of the note
  ([Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
- **Mic/audio indicator:** a small floating "nub" docks on the right
  edge while capture is active; draggable, clickable to return focus
  ([changelog](https://www.granola.ai/docs/changelog)).
  No banner to remote participants — capture is device-local
  ([Google Meet setup](https://www.granola.ai/blog/granola-google-meet-integration-recording-transcription)).
- **Pause / stop:** transcription can be paused mid-meeting (e.g. for
  passwords) and resumed; Stop ends the session
  ([Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
  Clicking a notification for the next meeting auto-pauses the
  previous one ([changelog](https://www.granola.ai/docs/changelog)).
- **Closing the window:** Granola stays resident in the tray and
  keeps capturing; quitting from the tray ends the session
  ([Granola 101](https://docs.granola.ai/help-center/getting-started/granola-101)).
  Force-quit-mid-meeting behavior is `[unverified]`.

## 4. After the meeting — the signature move

- **Landing state:** when recording stops the same note flips into
  "enhance" mode. User clicks **Enhance Notes** and the AI rewrites
  in place, merging typed input with transcript context
  ([AI-enhanced notes](https://help.granola.ai/article/ai-enhanced-notes),
  [Editing enhanced notes](https://www.granola.ai/docs/docs/101/afteryourmeeting/editing-your-enhanced-notes)).
- **Single-document layout, not tabbed.** Enhanced output replaces
  the raw view; AI lines render in **gray**, user lines in **black**.
  Editing a gray line turns it black — it is now "yours"
  ([AI-enhanced notes](https://help.granola.ai/article/ai-enhanced-notes)).
- **Transcript is a separate panel/tab** reachable from the note;
  action items and decisions are sections *inside* the enhanced doc,
  not separate tabs
  ([Deepgram case study](https://deepgram.com/voice-ai-apps/granola),
  [Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
- **Re-enhance / different template:** user can switch back to raw,
  edit, re-run enhance. Templates (discovery, 1:1, churn interview)
  and Recipes (draft email, extract decisions) swap the output
  structure
  ([Granola 101](https://docs.granola.ai/help-center/getting-started/granola-101),
  [Recipes launch](https://www.granola.ai/updates)).
- **Original notes preservation:** the black/gray colour-coding is
  the *only* preservation mechanism visible in the UI. A dedicated
  "original version" history tab is `[unverified]`; users keep raw
  drafts by editing before hitting enhance
  ([Editing enhanced notes](https://www.granola.ai/docs/docs/101/afteryourmeeting/editing-your-enhanced-notes)).
- **Chat-with-note / chat-with-folder** lets the user query the note
  or an entire folder post-meeting
  ([Recipes + Chat overhaul, Sept 2025](https://www.granola.ai/updates)).

## 5. Meetings list

- **List view** (left sidebar + note detail), reverse-chronological;
  not a grid or timeline by default
  ([Granola 101](https://docs.granola.ai/help-center/getting-started/granola-101)).
- **Auto-facets by People and Organizations:** click an attendee to
  filter every note with them; same for companies
  ([Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
- **Folders inside Spaces** group notes manually; Spaces are team
  workspaces with access controls
  ([Spaces + Folders launch](https://www.granola.ai/updates)).
- **Search:** full-text across notes *and transcripts*, works
  offline ([Wonder Tools](https://wondertools.substack.com/p/granolaguide)).
- Explicit date-range and topic filters are `[unverified]`.

## 6. Sharing

- **Share to attendees:** one-tap "share polished summary" from
  mobile ([App Store listing](https://apps.apple.com/us/app/granola-ai-meeting-notes/id6739429409)).
- **Shareable link:** yes — a Granola-hosted link to the enhanced
  note ([Sharing notes](https://docs.granola.ai/help-center/sharing/sharing-notes)).
- **Notion:** one-click send, but the note lands in a
  Granola-controlled Notion DB; source of truth stays in Granola, so
  Notion automations can't act on it as a native page
  ([MeetingNotes teardown](https://meetingnotes.com/blog/granola-ai-teardown),
  [Notion help](https://help.granola.ai/article/notion)).
- **Markdown / PDF / DOCX export: none native.** Reviewers flag this
  as a pain point; copy-paste or third-party scripts (Obsidian sync,
  CLI) are workarounds
  ([MeetingNotes teardown](https://meetingnotes.com/blog/granola-ai-teardown),
  [Granola-to-Obsidian](https://github.com/dannymcc/Granola-to-Obsidian),
  [granola-cli](https://github.com/magarcia/granola-cli)).
- **Outbound integrations:** Slack, HubSpot, Affinity, Attio, Zapier;
  MCP server + personal/enterprise API for programmatic access
  ([Sharing notes](https://docs.granola.ai/help-center/sharing/sharing-notes),
  [TechCrunch, Mar 2026](https://techcrunch.com/2026/03/25/granola-raises-125m-hits-1-5b-valuation-as-it-expands-from-meeting-notetaker-to-enterprise-ai-app/)).
- Auto-email to attendees / auto-attach to calendar event is
  `[unverified]` — sharing reads as a manual click.

## 7. Gaps vs a local-first notetaker like Coxinha

### Worth stealing, local-first compatible

- **"Jot + enhance" loop as the post-processing default.** Human note
  stays authoritative; AI lines visually distinct. Pure UX pattern.
- **Pre-created note from calendar metadata** with attendees + title
  populated. Local ICS / Outlook COM read is enough.
- **Tray-resident "g" + floating capture nub** on the right edge —
  matches our tray-resident invariant; nub is the model for Coxinha's
  "recording active" surface.
- **Hide-transcript-by-default, toggle to reveal** — respects
  "notes are primary."
- **Pause/resume capture for sensitive moments** — privacy-first,
  fits F1 zero-network.
- **People / Organizations auto-facets** from calendar — pure local
  index, no cloud inference.
- **Offline full-text search over transcripts** — SQLite FTS covers it.
- **Black-vs-gray human-vs-AI text in one doc** — maps cleanly to our
  Knowledge-vs-Memory invariant (ADR-0015): black = Knowledge, gray =
  Memory suggestion; editing promotes it.

### Worth stealing with adaptation

- **Shareable link to a note** — Granola hosts it; we need
  workspace-sharing (spec 0040) and an opt-in local relay. Pattern is
  still the right target.
- **Templates + Recipes** — ship as local YAML/MD prompt packs, not
  a cloud pool.
- **Chat-with-note / chat-with-folder** — viable against a local LLM
  or opt-in API key; retrieval is local.
- **"Share polished summary" one-click** — replace hosted link with
  local Markdown export + clipboard + optional email draft.
- **Notion / Slack outbound** — optional, explicit-opt-in plugins;
  never bundled by default.

### Cloud-dependent, not copying

- **Shared Templates / Recipes pool** — breaks local-first; replace
  with file-based sharing.
- **Team Spaces with granular ACLs** — requires hosted identity;
  out of scope for F1.
- **Hosted personal/enterprise APIs + MCP on Granola infra** — we
  expose a local MCP/HTTP endpoint instead.
- **Cloud auto-enhance on every meeting** — must run against a local
  model or user-supplied key.
- **Granola-hosted Notion DB as the "shared" surface** — creates
  lock-in; we stay filesystem-canonical.
