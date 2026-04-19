# Spec 0010: Settings view UI

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0005, ADR-0008, ADR-0009, ADR-0012

## Why
The user should be able to switch transcriber/diarizer/LLM
provider, rebind shortcuts, pick a locale and point at models
without editing `~/coxinha/.coxinha/config.toml` by hand.

## Scope

### In
- Tabbed Settings view:
  - **Audio** — input device (future: separate mic vs loopback
    devices), base sample rate (read-only info for now)
  - **Transcription** — engine (Whisper / Parakeet), model path,
    accelerator (CPU / CUDA / DirectML)
  - **Diarization** — engine (None / Pyannote / Speakrs), model
    paths
  - **LLM** — provider (Ollama / Claude / OpenAI / Groq /
    OpenRouter), endpoint, model name, "Test connection" button
  - **Shortcuts** — capture-style rebinding for each of the 5
    global shortcuts
  - **Appearance** — locale (auto / en / ...), theme (auto / light
    / dark; wired once theme tokens support it)
  - **Models** — lists files under `~/coxinha/.coxinha/models/`,
    shows size, "Open folder" button, hard-purge trash
- Persisted through the existing `update_config` IPC command
- Validation: unparseable shortcut, missing model path, unreachable
  LLM endpoint → inline error; Save disabled until valid
- "Reset to defaults" deletes the custom config file and
  recreates defaults on next load

### Out
- Multiple config profiles / workspaces → F2+
- Cloud config sync → F2

## Behavior (acceptance)
- Opening Settings pre-fills every field from the current
  `AppConfig`
- Changing transcriber engine → Save → next `transcribe_meeting`
  uses the new engine (no restart required; the refactor already
  rebuilds engines on config change)
- Invalid shortcut (e.g. `Ctrl+ZZZ`) shows an inline error; Save
  stays disabled
- Shortcut conflict detection: on Save, if `global_shortcut::register`
  reports a binding already claimed by another app (or another
  Coxinha shortcut), surface the offending combo inline with a
  "rebind to something else" hint. This is the failure mode
  Handy's issue tracker shows users hit repeatedly, and our
  current `shortcuts::register_all` only logs a warning —
  Settings must escalate it into the UI.
- "Test LLM connection" hits a lightweight endpoint (e.g. list
  models) and reports success/failure in <5s
- Reset clears `config.toml` and the next reload shows defaults
- **Atomic config writes (Handy #1262 addendum):** every Save
  writes to `.coxinha/config.toml.tmp`, fsyncs, then renames
  onto `config.toml`. Old file goes to `.coxinha/config.toml.bak`
  before the rename. On corrupt/malformed read at startup,
  Coxinha loads `.bak` and surfaces a toast explaining the
  rollback — never silently regenerates with defaults and
  discards the user's data.

## Design notes
- shadcn `<Tabs>` for sections
- Form state local (React) with Zod-like validation; submit
  shapes an `AppConfig` and calls `update_config`
- All labels/placeholders via `t('settings.*')`
- Keyboard capture for shortcuts uses the browser's `keydown`
  event; converts to the `Ctrl+Alt+X` string the backend expects

## Open questions
- "Test connection" for each provider — skip for Ollama (anyone
  with localhost:11434 probably works) or include for uniformity?
  Include.
- Live shortcut conflict check against existing ones? Yes.
