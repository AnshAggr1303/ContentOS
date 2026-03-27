# TODOS — ContentOS

## Token Budget Audit for Compliance System Prompt
**What:** Measure the token count of the injected rules block + a typical article. If it exceeds 8,000 tokens, trim rule descriptions to 1-line summaries.
**Why:** Compliance accuracy is the core product value. Token overflow near llama-3.3-70b context limits means rules near the end of the prompt are silently ignored.
**Pros:** Catching this before the demo is much better than finding it mid-presentation.
**Cons:** Requires a manual token count pass and possibly editing rule JSON files.
**Context:** Run tiktoken (or `cl100k_base` encoding) on the concatenated sebi.json + brand.json + legal.json block. Target: rules block < 3,000 tokens, full prompt < 12,000 tokens. If over, trim `description` and `suggested_rewrite_hint` fields to 1-line summaries.
**Depends on:** loadRules() module-level caching (already decided in eng review).

---

## SSE Reconnection Handling
**What:** Implement `Last-Event-ID` reconnect on `/api/stream` — replay job events from SQLite on reconnect so the editor UI catches up after a browser refresh.
**Why:** Browser refreshes during a pipeline run silently drop the SSE connection. The pipeline continues but the UI shows nothing. Extremely confusing during a demo or real use.
**Pros:** Makes the UI resilient to refreshes. The jobs table (already planned) can serve as an event replay source.
**Cons:** Requires buffering events per job in SQLite (an `events` column or table).
**Context:** On reconnect, `/api/stream` should check the `Last-Event-ID` header and replay all events for that jobId from SQLite. Start with just replaying the current job `status` field, which is sufficient to re-render the UI.
**Depends on:** Jobs table in SQLite (already decided in eng review).

---

## Prompt Injection Mitigation
**What:** Add input validation and basic sanitization before user content is injected into Groq system prompts.
**Why:** Enterprise pitch — if a judge asks "what about adversarial inputs?" you need an answer. A crafted press release could override agent instructions.
**Pros:** Strengthens the enterprise credibility. Minimal implementation: input length cap (10,000 chars) + strip obvious injection phrases ("ignore previous instructions", "disregard the above").
**Cons:** Full mitigation is complex and not demo-blocking.
**Context:** Minimal approach: add a `sanitizeInput(text: string): string` function in `lib/` that strips known injection patterns and enforces max length. Apply before all agent calls. Also useful as a 1-paragraph "Security Considerations" in the pitch deck.
**Depends on:** Nothing.
