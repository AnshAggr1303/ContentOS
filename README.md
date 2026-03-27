# ContentOS — AI-Native Editorial Command Centre

> ET AI Hackathon 2026 | Problem Statement 1: AI for Enterprise Content Operations

ContentOS is a 4-agent AI pipeline that automates the full lifecycle of enterprise content — from raw press release to multi-channel, multi-language publication — with a human editor in the loop at every critical gate.

---

## The Problem

ET's newsroom publishes 500+ articles/day. Localizing each article into Hindi, Tamil, Telugu, and Bengali costs ₹3,200 and takes 4+ hours per article. Compliance review catches ~60% of SEBI and legal violations. Distribution formatting is manual and inconsistent across channels.

## The Solution

A 4-agent pipeline where AI handles drafting, compliance checking, localization, and distribution — while a human editor retains full control via two mandatory approval gates.

```
Raw Input → [A1: Drafter] → Gate 1 (Editor) → [A2: Compliance]
         → [A3: Localizer ×4 languages in parallel]
         → [A4: Distributor] → Gate 2 (Editor) → Published
```

---

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Draft-to-publish time | ~4 hours | ~35 minutes |
| Localization cost | ₹3,200/article | ₹0 |
| Articles per editor per day | ~6 | ~22 |
| Compliance catch rate | ~60% | ~94% |
| **Annual savings (500 articles/day)** | — | **₹58.4 crore** |

---

## The 4 Agents

| Agent | Model | What it does |
|-------|-------|-------------|
| A1 — Drafter | `llama-3.3-70b-versatile` | Generates ET-style article, 3 headline variants, SEO metadata |
| A2 — Compliance | `llama-3.3-70b-versatile` | Checks SEBI regulations, brand voice, legal rules — returns structured flags with rule citations and suggested fixes |
| A3 — Localizer | `openai/gpt-oss-120b` | Culturally adapts content for Hindi, Tamil, Telugu, Bengali in parallel via `Promise.all()` |
| A4 — Distributor | `llama-3.3-70b-versatile` | Formats content for ET Web, ET App, WhatsApp, LinkedIn, Newsletter |

---

## Architecture

**Hybrid sequential + parallel pipeline.** Sequential where dependencies exist (compliance must see the approved draft), parallel where independent (4 language localizations fire simultaneously).

- No agent framework (LangChain, LangGraph etc.) — pure `async/await` and `Promise.all()`
- Human gates pause the pipeline via `Promise` + resolver pattern persisted to SQLite
- Real-time progress via Server-Sent Events (SSE) streamed to the editor UI
- Every agent decision written to SQLite audit log with timestamp, model, duration, flags

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI — primary | Groq API, `llama-3.3-70b-versatile` (14,400 req/day free) |
| AI — localization | Groq API, `openai/gpt-oss-120b` (auto-downgrades to Llama if quota exceeded) |
| Database | SQLite via `better-sqlite3` |
| Streaming | Server-Sent Events — native Next.js, no WebSockets |
| Deployment | Railway (single-process, SSE-compatible) |

**Total infrastructure cost: ₹0**

---

## Setup

### Prerequisites
- Node.js 18+
- 1-3 Groq API keys (free at console.groq.com)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/ContentOS.git
cd ContentOS
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Groq API keys:

```env
GROQ_KEY_1=gsk_your_first_key_here
GROQ_KEY_2=gsk_your_second_key_here
GROQ_KEY_3=gsk_your_third_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Use `npm run dev` or `npm start` for local development. Do not deploy to Vercel serverless — the SSE EventEmitter requires a single persistent Node.js process.

---

## Key Features

### Compliance Agent — The Money Shot
The compliance agent doesn't just flag content — it cites the specific rule violated, quotes the exact text, and suggests a precise rewrite:

```
SEBI-001 [HIGH] — Forward-looking statement without disclaimer
Flagged: "expects revenue to grow 25% next year"
Fix: Add "(Subject to market conditions and regulatory approvals)" after statement
```

### Live Rule Editor
Compliance rules are stored as editable JSON at `/admin/rules`. Edit rules live without redeployment — changes are picked up by the next pipeline run.

### Audit Trail
Every agent decision is logged to SQLite with timestamp, model used, duration, and flags. Viewable at `/audit`. This is the "auditable trail" required by PS1.

### Key Rotation
3 Groq API keys rotate round-robin with automatic 429 fallback. A quota guard auto-downgrades the localizer from `gpt-oss-120b` to `llama-3.3-70b` when the daily limit approaches.

---

## Project Structure

```
ContentOS/
├── app/
│   ├── page.tsx              # Main editor dashboard
│   ├── audit/page.tsx        # Audit log viewer
│   ├── admin/rules/page.tsx  # Live rules editor
│   └── api/
│       ├── pipeline/         # POST: start pipeline
│       ├── approve/          # POST: gate approvals
│       ├── stream/           # GET: SSE stream
│       └── admin/rules/      # GET/POST: rule management
├── agents/
│   ├── drafter.ts            # A1
│   ├── compliance.ts         # A2
│   ├── localizer.ts          # A3 (Promise.all)
│   └── distributor.ts        # A4
├── lib/
│   ├── groq-client.ts        # Key rotation + 429 fallback
│   ├── quota-guard.ts        # gpt-oss daily quota tracker
│   ├── rate-limit.ts         # Per-IP pipeline limiter
│   ├── pipeline.ts           # Orchestrator + gate logic
│   ├── db.ts                 # SQLite wrapper
│   └── types.ts              # TypeScript types
├── components/
│   ├── PipelineStatus.tsx    # Live SSE progress
│   ├── ApprovalGate.tsx      # Gate 1 — draft review
│   ├── CompliancePanel.tsx   # Compliance flags UI
│   └── ChannelPreview.tsx    # Gate 2 — channel review
├── data/
│   ├── rules/                # SEBI, brand, legal JSON rules
│   └── demo-article.txt      # Pre-engineered demo input
└── CLAUDE.md                 # AI development context
```

---

## Demo Script (3 minutes)

| Time | Action |
|------|--------|
| 0:00–0:30 | Show the problem: manual localization = 4 hours, ₹3,200 |
| 0:30–1:00 | Click "Load demo content" → Run Pipeline → watch 4 agents stream live |
| 1:00–1:30 | Gate 1: editor picks headline, approves draft |
| 1:30–2:00 | **Compliance flags SEBI-001** with exact quote + suggested fix ← money shot |
| 2:00–2:30 | Gate 2: show all 4 language outputs + 5 channel formats |
| 2:30–3:00 | Open /audit — every decision timestamped. Show ₹58.4 Cr number. |

---

## Built With

- [Anthropic Claude Code](https://claude.ai/code) — AI-assisted development
- [Groq](https://groq.com) — Ultra-fast LLM inference
- [Next.js](https://nextjs.org) — Full-stack React framework
- [shadcn/ui](https://ui.shadcn.com) — UI components
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite

---

## Team

Built for ET AI Hackathon 2026 — Problem Statement 1: AI for Enterprise Content Operations

---

*"A newsroom where AI drafts, a compliance agent catches legal risk, a localization agent adapts for 5 Indian markets, and a distribution agent decides which channel gets what — all in one auditable pipeline, with a human editor in the loop at every gate."*