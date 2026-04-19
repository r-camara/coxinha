# Spec 0005: Call detection

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
For the "joined a meeting → app offers to record" flow. No bot
joining the meeting.

## Scope

### In
- 3s polling of `IAudioSessionManager2` (Windows COM)
- Match process name against a known-apps list (Teams, Zoom, Webex,
  Discord, Slack)
- Emit `call-detected` event (once per PID)
- `active_calls: Vec<ActiveCall>` state exposed via `get_active_calls`
- Frontend toast with "Record now" button

### Out
- In-browser call detection (Meet, Teams Web) → separate research,
  possibly F1.5
- Auto-start recording → config option, default is ask
- Recording itself → spec 0006

## Behavior (acceptance)
- **Open Teams + join a call:** within 3s, `call-detected` reaches
  the frontend; toast appears
- **Toast dismissed:** does not reappear for the same PID; PID going
  away and coming back re-fires
- **Multiple concurrent calls** (rare but possible): each gets its
  own event
- **Non-Windows:** stub returns empty; app does not crash

## Design notes
- `src-tauri/src/call_detector.rs`: scaffold exists
- Windows COM: `CoInitializeEx` + `IMMDeviceEnumerator` +
  `IAudioSessionManager2` + `IAudioSessionControl2`
- Resolve PID→process name via `QueryFullProcessImageNameW`
- Runs in a separate tokio task; reports via `app.emit()`

## Open questions
- "Call started" vs "just playing audio": Teams always opens an
  audio session, even idle. Filtering with `GetState()`
  (`AudioSessionStateActive`) should work — validate with a test.
- Browser (Meet): `msedge.exe` + a tab-title heuristic? Risky.
  Leave out for now.
- Privacy: log detected app names? Default off, opt-in under a
  "send telemetry" toggle (which doesn't exist yet anyway).
