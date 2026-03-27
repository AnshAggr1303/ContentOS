# CLAUDE.md — ContentOS
### ET AI Hackathon 2026 | Problem Statement 1

> Read this entire file before doing anything. This is the single source of truth for every decision in this project.

---

## What This Project Is

**ContentOS** is a 4-agent AI pipeline for enterprise content operations. It automates the full lifecycle of content: drafting → compliance review → localization → multi-channel distribution. Built for Economic Times's newsroom.

**Hackathon:** ET AI Hackathon 2026, Problem Statement 1 (AI for Enterprise Content Operations).

**The one-line pitch:** A newsroom where AI drafts, a compliance agent catches legal risk, a localization agent adapts for 5 Indian markets, and a distribution agent decides which channel gets what — with a human editor in the loop at every gate, and every decision written to an audit log.

---

## Model Configuration

**Claude Code model:** claude-opus-4-6
**Effort level:** high (use `/effort high` at session start for complex work)
**For architecture/planning sessions:** type `ultrathink` in prompt for maximum reasoning depth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI — primary | Groq API, `llama-3.3-70b-versatile` |
| AI — localization | Groq API, `openai/gpt-oss-120b` (with Llama fallback) |
| Database | SQLite via `better-sqlite3` |
| Rules storage | JSON flat files in `/data/rules/` |
| Streaming | Server-Sent Events (SSE) — native Next.js |
| Deployment | Vercel |

**Never use:** Prisma, MongoDB, Redis, WebSockets, LangChain, any agent framework. Keep the stack minimal.

---

## Environment Variables

```env
GROQ_KEY_1=gsk_...   # teammate 1
GROQ_KEY_2=gsk_...   # teammate 2
GROQ_KEY_3=gsk_...   # you
NEXT_PUBLIC_APP_NAME=ContentOS
```

Keys are loaded from `.env.local`. Never hardcode keys. Never commit `.env.local`.

---

## The 4 Agents

### Agent 1 — Drafter (`agents/drafter.ts`)
- **Model:** `llama-3.3-70b-versatile`
- **Input:** Raw content (press release / brief / report) + word count + content type
- **Output:** Full article in ET journalism style, 3 headline variants, SEO meta description, tags, read time estimate
- **System prompt direction:** Senior ET journalist, direct and data-backed, no fluff, active voice

### Agent 2 — Compliance Reviewer (`agents/compliance.ts`)
- **Model:** `llama-3.3-70b-versatile`
- **Input:** Approved draft + full contents of all 3 rule files injected into context
- **Output:** Strict JSON only:
```json
{
  "status": "PASS" | "FLAG",
  "overall_risk": "low" | "medium" | "high",
  "flags": [
    {
      "rule_id": "SEBI-001",
      "severity": "high",
      "quote": "exact text from article",
      "rule_description": "what rule was violated",
      "suggested_fix": "exact rewrite suggestion"
    }
  ]
}
```
- **Critical:** Must use `response_format: { type: "json_object" }` in the Groq call. Never return prose.

### Agent 3 — Localizer (`agents/localizer.ts`)
- **Model:** `openai/gpt-oss-120b` — auto-downgrade to `llama-3.3-70b-versatile` if quota > 2800
- **Input:** Approved English article + target language
- **Output:** Culturally adapted article — NOT literal translation. Use local examples, idioms, references appropriate to that region.
- **Execution:** Fire all 4 language calls in parallel with `Promise.all()`. Never sequential.
- **Languages:** Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Bengali (`bn`)
- **System prompt direction:** Native [language] business journalist. Adapt culturally, not literally. Preserve facts, rewrite context.

### Agent 4 — Distributor (`agents/distributor.ts`)
- **Model:** `llama-3.3-70b-versatile`
- **Input:** Final compliant English article + selected channels
- **Output:** Strict JSON with channel-specific formatted content:
```json
{
  "et_web": { "headline": "...", "body": "...", "tags": [] },
  "et_app": { "push_title": "...", "card_preview": "..." },
  "whatsapp": { "text": "3 lines max, plain text, no markdown" },
  "linkedin": { "hook": "...", "body": "...", "cta": "..." },
  "newsletter": { "subject": "...", "preview_text": "..." }
}
```

---

## Pipeline Architecture

```
[Raw Input]
    ↓
[A1: Drafter] — llama-3.3-70b-versatile
    ↓
[HUMAN GATE 1] — pipeline pauses, editor reviews + approves draft
    ↓
[A2: Compliance] — llama-3.3-70b-versatile, injects rule files
    ↓
    ├─ Promise.all() ─────────────────────────────────┐
    │  [A3: Hindi]   [A3: Tamil]   [A3: Telugu]   [A3: Bengali]
    └──────────────── gpt-oss-120b ──────────────────┘
    ↓
[A4: Distributor] — llama-3.3-70b-versatile
    ↓
[HUMAN GATE 2] — pipeline pauses, editor reviews all channels + publishes
    ↓
[Audit Log Written] — SQLite, every decision saved
```

**Architecture type:** Hybrid sequential + parallel. Sequential where dependencies exist, parallel for localization. No DAG framework. No event bus. Just `async/await` and `Promise.all()`.

---

## Groq Client (`lib/groq-client.ts`)

Round-robin key rotation with 429 fallback:

```typescript
const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean) as string[]

let currentIndex = 0

export async function callGroq(params: any) {
  const keysToTry = [...GROQ_KEYS.keys()]
  for (const i of keysToTry) {
    try {
      const client = new Groq({ apiKey: GROQ_KEYS[i] })
      return await client.chat.completions.create(params)
    } catch (err: any) {
      if (err.status === 429 && i < keysToTry.length - 1) continue
      throw err
    }
  }
}
```

Always use `callGroq()` — never instantiate `new Groq()` directly anywhere else.

---

## Quota Guard (`lib/quota-guard.ts`)

Tracks daily gpt-oss-120b usage. Auto-downgrades to Llama when approaching limit.

- Hard limit per key: 1,000/day
- 3 keys = 3,000/day total
- Guard threshold: 2,800 (200 buffer)
- Reset: midnight UTC (match Groq's reset time exactly)

```typescript
export function getLocalizerModel(): string {
  return shouldUseGptOss() 
    ? "openai/gpt-oss-120b" 
    : "llama-3.3-70b-versatile"
}
```

---

## Rate Limiter (`lib/rate-limit.ts`)

Per-IP limiter on `/api/pipeline`:
- Max 2 requests per 30 seconds per IP
- In-memory `Map<string, number[]>` — no Redis
- Apply in `/api/pipeline/route.ts` before anything else runs

---

## Audit Log (`lib/db.ts`)

SQLite database at `data/db.sqlite`. Auto-created on first run.

Schema:
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id        TEXT NOT NULL,
  agent_name    TEXT NOT NULL,
  model_used    TEXT NOT NULL,
  timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
  input_hash    TEXT,
  output_summary TEXT,
  flags         TEXT,
  decision      TEXT,
  duration_ms   INTEGER
);
```

Write an audit entry at the END of every agent call. `output_summary` = first 200 chars of output. `flags` = JSON stringified array of compliance flags (empty array for non-compliance agents).

---

## Compliance Rules (`data/rules/`)

Three JSON files. Each is an array of rule objects:

```json
[
  {
    "id": "SEBI-001",
    "category": "regulatory",
    "description": "Forward-looking statements must include disclaimer",
    "pattern_hint": "will grow|expects to|projects|forecasts|targets",
    "severity": "high",
    "suggested_rewrite_hint": "Add after statement: '(Subject to market conditions and regulatory approvals)'"
  }
]
```

Files:
- `sebi.json` — 5+ SEBI regulations (forward-looking statements, insider trading mentions, price-sensitive info handling)
- `brand.json` — 5+ ET brand voice rules (tone, terminology, competitor mention guidelines)
- `legal.json` — 5+ defamation/legal rules (attribution requirements, unverified claims, source citation)

The compliance agent reads ALL THREE files and injects them into its system prompt at runtime.

---

## Human Gates

### Gate 1 (after A1, before A2)
- Pipeline writes job state `status: 'awaiting_gate_1'` to SQLite
- SSE stream sends `{ event: 'gate_1', data: { draft, headlines } }`
- Frontend shows draft + headline picker + approve/reject buttons
- Editor can edit draft inline before approving
- `POST /api/approve` with `{ jobId, gate: 1, approved: true, selectedHeadline, editedDraft }` resumes pipeline

### Gate 2 (after A4, before publish)
- Pipeline writes `status: 'awaiting_gate_2'`
- SSE sends `{ event: 'gate_2', data: { channels, localizations } }`
- Frontend shows all channel versions side by side + all 4 language versions
- Editor can deselect individual channels
- `POST /api/approve` with `{ jobId, gate: 2, approved: true, selectedChannels }` triggers mock publish

---

## SSE Streaming (`app/api/stream/route.ts`)

Stream agent progress events to the editor UI in real time. Event format:

```
event: agent_start
data: {"agent": "drafter", "model": "llama-3.3-70b-versatile"}

event: agent_complete
data: {"agent": "drafter", "duration_ms": 3420, "output_preview": "..."}

event: gate_1
data: {"draft": "...", "headlines": ["...", "...", "..."]}

event: compliance_flag
data: {"rule_id": "SEBI-001", "severity": "high", "quote": "..."}

event: gate_2
data: {"channels": {...}, "localizations": {...}}

event: complete
data: {"job_id": "...", "total_duration_ms": 28000}
```

---

## UI Pages

### `/` — Main Editor Dashboard (`app/page.tsx`)
Design direction: editorial newsroom aesthetic. Clean, professional, fast-feeling. Dark sidebar, light content area. Think Bloomberg Terminal meets editorial CMS.

Components needed:
- `InputPanel` — raw content textarea, language checkboxes, channel checkboxes, Run button
- `PipelineStatus` — live agent progress (SSE consumer), shows each agent running/complete
- `ApprovalGate` — modal/panel for both Gate 1 and Gate 2
- `CompliancePanel` — shows flags with rule_id, severity badge, quote, suggested fix
- `ChannelPreview` — side-by-side channel versions at Gate 2

### `/audit` — Audit Log Viewer (`app/audit/page.tsx`)
Clean data table. Columns: timestamp, job_id (truncated), agent, model, decision, flags count, duration. Row click shows full details. Filter by agent name and date.

### `/admin/rules` — Rules Editor (`app/admin/rules/page.tsx`)
Shows all 3 rule files. Each rule is editable inline. Save button writes back to the JSON file. No auth needed for hackathon — it's a local admin page.

---

## File Structure

```
contentos/
├── CLAUDE.md                          ← this file
├── app/
│   ├── page.tsx                       ← main editor dashboard
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── pipeline/route.ts          ← POST: start pipeline
│   │   ├── approve/route.ts           ← POST: gate approval
│   │   └── stream/route.ts            ← GET: SSE stream
│   ├── audit/page.tsx                 ← audit log viewer
│   └── admin/rules/page.tsx           ← rules editor
├── agents/
│   ├── drafter.ts                     ← A1
│   ├── compliance.ts                  ← A2
│   ├── localizer.ts                   ← A3 (Promise.all)
│   └── distributor.ts                 ← A4
├── components/
│   ├── PipelineStatus.tsx
│   ├── ApprovalGate.tsx
│   ├── CompliancePanel.tsx
│   └── ChannelPreview.tsx
├── lib/
│   ├── groq-client.ts                 ← key rotation + 429 fallback
│   ├── quota-guard.ts                 ← gpt-oss daily tracker
│   ├── rate-limit.ts                  ← per-IP limiter
│   ├── pipeline.ts                    ← orchestrator
│   ├── db.ts                          ← SQLite wrapper
│   └── types.ts                       ← all TypeScript types
├── data/
│   ├── rules/
│   │   ├── sebi.json
│   │   ├── brand.json
│   │   └── legal.json
│   └── db.sqlite                      ← auto-created, gitignored
├── .env.local                         ← real keys, gitignored
├── .env.example                       ← template, committed
├── .gitignore
└── package.json
```

---

## TypeScript Types (`lib/types.ts`)

Define these types and use them everywhere:

```typescript
export type ContentType = 'news' | 'analysis' | 'explainer' | 'opinion'
export type Language = 'hi' | 'ta' | 'te' | 'bn'
export type Channel = 'et_web' | 'et_app' | 'whatsapp' | 'linkedin' | 'newsletter'
export type AgentName = 'drafter' | 'compliance' | 'localizer' | 'distributor'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PipelineStatus = 
  | 'idle' | 'running_a1' | 'awaiting_gate_1' 
  | 'running_a2' | 'running_a3' | 'running_a4' 
  | 'awaiting_gate_2' | 'complete' | 'failed'

export interface ComplianceFlag {
  rule_id: string
  severity: RiskLevel
  quote: string
  rule_description: string
  suggested_fix: string
}

export interface ComplianceResult {
  status: 'PASS' | 'FLAG'
  overall_risk: RiskLevel
  flags: ComplianceFlag[]
}

export interface PipelineJob {
  id: string
  status: PipelineStatus
  input: string
  contentType: ContentType
  selectedLanguages: Language[]
  selectedChannels: Channel[]
  draft?: string
  headlines?: string[]
  selectedHeadline?: string
  complianceResult?: ComplianceResult
  localizations?: Record<Language, string>
  channelOutputs?: Record<Channel, any>
  createdAt: Date
  updatedAt: Date
}

export interface AuditEntry {
  jobId: string
  agentName: AgentName
  modelUsed: string
  inputHash: string
  outputSummary: string
  flags: ComplianceFlag[]
  decision: string
  durationMs: number
}
```

---

## Critical Rules for Claude Code to Follow

1. **Always use `callGroq()` from `lib/groq-client.ts`** — never `new Groq()` directly anywhere
2. **Always use `getLocalizerModel()` from `lib/quota-guard.ts`** for A3's model selection
3. **Always write to audit log** at the end of every agent function — no exceptions
4. **A3 must use `Promise.all()`** — never loop sequentially over languages
5. **A2 must return JSON only** — use `response_format: { type: "json_object" }` in the Groq call
6. **Pipeline must pause at both gates** — the orchestrator awaits a database state change
7. **Never use `any` TypeScript type** — use the types defined in `lib/types.ts`
8. **Never hardcode API keys** — always `process.env.GROQ_KEY_N`
9. **SSE stream must send events for every agent start and complete** — editor needs real-time feedback
10. **Compliance flags must include `rule_id` and `suggested_fix`** — vague flags lose the demo

---

## Impact Numbers (For Demo)

Memorize these. Put them on the dashboard.

| Metric | Before | After |
|---|---|---|
| Draft-to-publish time | ~4 hours | ~35 minutes |
| Localization cost per article | ₹3,200 (4 languages) | ₹0 |
| Articles per editor per day | ~6 | ~22 |
| Compliance catch rate | ~60% | ~94% |
| Annual localization savings (500 articles/day) | — | ₹58.4 crore |

---

## Demo Script (3 Minutes)

```
0:00–0:30  Problem: show manual localization takes 4+ hours
0:30–1:00  Paste ET press release → Run Pipeline → watch agents stream live
1:00–1:30  Gate 1: editor picks headline, approves draft
1:30–2:00  Compliance flags SEBI-001 with exact quote + suggested fix  ← MONEY SHOT
2:00–2:30  Gate 2: show all 4 language outputs + 5 channel formats
2:30–3:00  Open /audit — every decision timestamped. Show ₹58.4cr number.
```

**The money shot at 1:30** — compliance agent saying:
> "SEBI-001 [HIGH]: 'expects revenue to grow 25% next year' — Forward-looking statement requires disclaimer. Suggested fix: Add '(Subject to market conditions and regulatory approvals)' after statement."

No other team will have this level of specificity. This wins the demo.

---

*Last updated: March 2026 | Model: claude-opus-4-6 | Effort: high*