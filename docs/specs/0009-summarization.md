# Spec 0009: LLM summarization

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0007 (transcription)
- **Relevant ADRs:** ADR-0005

## Why
A 1-hour raw transcript is 8k tokens, not "meeting notes". A
structured summary is the product that actually matters.

## Scope

### In
- Command `summarize_meeting(id) -> String`
- Reads `transcript.json`, formats with timestamps + speaker
- Calls the LLM via `genai` using the `config.llm` provider
- Default English prompt (executive summary + topics + decisions +
  actions + open items)
- Saves `~/coxinha/meetings/<id>/summary.md`
- Updates `meetings.has_summary` in the DB

### Out
- User-customizable prompts in the UI → F1.5+
- Structured extraction (JSON of actions) → F4
- Follow-up emails / messages → F3+

## Behavior (acceptance)
- **Local Ollama + llama3.2:3b:** decent summary in <30s for a
  30-min transcript
- **Claude Sonnet:** summary in <10s, quality >> local
- **Provider without an API key:** clear error pointing to
  `.env.example`
- **Missing transcript:** "transcribe first" error
- **LLM timeout / network error:** does not corrupt a previous
  summary; reported to the user
- **Idempotency:** calling twice regenerates (overwrites); no
  concatenation

## Design notes
- `src-tauri/src/summarizer.rs`: scaffold already present
- `LlmProvider` enum in `shared::`
- `genai::Client::default()` respects per-provider env vars
- Prompt lives as a constant; future customization via
  `~/coxinha/.coxinha/prompts/summary.md` when the file exists

## Open questions
- `genai 0.5` API: `ChatRequest::new(Vec<ChatMessage>)` and
  `res.content_text_as_str()` may be different — validate
- Whole transcript vs chunk + map-reduce: default to whole until we
  hit the context limit, then chunk
- Saved summary: part of the vault (user-visible/editable) or
  hidden? Default: visible at `meetings/<id>/summary.md`
