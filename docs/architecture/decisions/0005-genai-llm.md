# ADR-0005: `genai` crate for LLM

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
We want to swap freely between local Ollama, Claude API, OpenAI,
Groq, OpenRouter. Each provider ships its own SDK.

## Decision
The `genai` crate (jeremychone/rust-genai) as a single abstraction.
Provider configured in `~/coxinha/.coxinha/config.toml`.

## Consequences
- **+** Switching provider is changing a string in the config
- **+** Uniform streaming, tool use, structured output
- **−** Still 0.x, APIs churn. Pin versions, review on upgrade.
