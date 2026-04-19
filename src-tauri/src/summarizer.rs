//! LLM-backed summarizer via `genai` (Ollama, Claude, OpenAI, Groq,
//! OpenRouter).
//!
//! Default English prompt. Custom templates can live under
//! `~/coxinha/.coxinha/prompts/summary.md` when present.

use std::sync::Arc;

use anyhow::{Context, Result};
use genai::Client;
use shared::*;
use uuid::Uuid;

use crate::storage::Storage;

const DEFAULT_PROMPT: &str = r#"You are an assistant that summarizes meetings.

Below is the transcript of a meeting. Produce a structured markdown
summary containing:

- **Executive summary** (2-3 sentences)
- **Topics discussed** (bullets, one line each)
- **Decisions made** (if any)
- **Actions / next steps** (if any, with the owner when mentioned)
- **Open items** (unresolved questions)

Be objective. Do not invent information that is not in the transcript.

---

Transcript:
{transcript}
"#;

pub struct Summarizer {
    provider: LlmProvider,
    client: Client,
    storage: Arc<Storage>,
}

impl Summarizer {
    pub fn new(provider: LlmProvider, storage: Arc<Storage>) -> Self {
        // `genai` reads provider endpoints/keys from the environment.
        // For Ollama we set OLLAMA_HOST once here (rather than on every
        // request) and rely on `update_config` rebuilding the summarizer
        // when the endpoint changes.
        if let LlmProvider::Ollama { endpoint, .. } = &provider {
            std::env::set_var("OLLAMA_HOST", endpoint);
        }

        Self {
            provider,
            client: Client::default(),
            storage,
        }
    }

    pub async fn summarize_meeting(&self, id: Uuid) -> Result<String> {
        let meeting_dir = self.storage.meeting_dir(id);
        let transcript_path = meeting_dir.join("transcript.json");
        let transcript_raw = tokio::fs::read_to_string(&transcript_path)
            .await
            .with_context(|| format!("reading {}", transcript_path.display()))?;
        let transcript: Transcript = serde_json::from_str(&transcript_raw)?;

        let text = format_transcript(&transcript);
        let prompt = DEFAULT_PROMPT.replace("{transcript}", &text);

        let summary = self.call_llm(&prompt).await?;

        tokio::fs::write(meeting_dir.join("summary.md"), &summary).await?;
        Ok(summary)
    }

    async fn call_llm(&self, prompt: &str) -> Result<String> {
        use genai::chat::{ChatMessage, ChatRequest};

        let chat_req = ChatRequest::new(vec![ChatMessage::user(prompt)]);

        let res = self
            .client
            .exec_chat(self.provider.model(), chat_req, None)
            .await
            .map_err(|e| anyhow::anyhow!("LLM error: {:?}", e))?;

        res.content_text_as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow::anyhow!("empty LLM response"))
    }
}

fn format_transcript(t: &Transcript) -> String {
    let mut out = String::new();
    for seg in &t.segments {
        let speaker = seg.speaker.as_deref().unwrap_or("Speaker");
        out.push_str(&format!(
            "[{:.1}s] {}: {}\n",
            seg.start, speaker, seg.text
        ));
    }
    out
}
