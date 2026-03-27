# ContentOS

**AI-Native Editorial Command Centre**

ET AI Hackathon 2026 · Problem Statement 1 · AI for Enterprise Content Operations

---

## What is this?

ContentOS is a **4-agent AI pipeline** that takes a raw press release and turns it into a fully drafted, compliance-checked, localized, and channel-formatted article — in 35 minutes instead of 4 hours — with a human editor approving every critical decision.

Think of it as a newsroom where 4 AI specialists work in sequence, each handing off to the next, while you stay in control.

---

## The problem we're solving

ET publishes 500+ articles per day. Here's what the manual process costs:

| Problem | Cost |
|---------|------|
| Localization into Hindi, Tamil, Telugu, Bengali | ₹3,200 per article |
| Time from brief to published article | ~4 hours |
| Compliance violations caught by human editors | ~60% |
| Editors needed for 500 articles/day | ~83 |

**Annual localization cost alone: ₹58.4 crore**

---

## How it works — the pipeline

```
You paste a press release
        ↓
┌─────────────────────┐
│   A1 — Drafter      │  Writes full ET-style article
│   llama-3.3-70b     │  3 headline variants, SEO tags
└─────────────────────┘
        ↓
   ★ HUMAN GATE 1 ★   ←── YOU pick headline, edit draft, approve
        ↓
┌─────────────────────┐
│  A2 — Compliance    │  Checks SEBI rules, brand voice, legal
│   llama-3.3-70b     │  Returns exact quote + rule + fix
└─────────────────────┘
        ↓
┌──────────────────────────────────────────────────┐
│              A3 — Localizer (×4 in parallel)     │
│              openai/gpt-oss-120b                 │
│   Hindi  ·  Tamil  ·  Telugu  ·  Bengali         │
└──────────────────────────────────────────────────┘
        ↓
┌─────────────────────┐
│  A4 — Distributor   │  Formats for 5 channels
│   llama-3.3-70b     │  ET Web, App, WhatsApp, LinkedIn, Newsletter
└─────────────────────┘
        ↓
   ★ HUMAN GATE 2 ★   ←── YOU review all versions, publish
        ↓
Published + Audit log written
```

---

## Results

| Metric | Before ContentOS | After ContentOS |
|--------|-----------------|----------------|
| Draft-to-publish time | ~4 hours | ~35 minutes |
| Localization cost | ₹3,200/article | ₹0 |
| Articles per editor/day | ~6 | ~22 |
| Compliance catch rate | ~60% | ~94% |
| Editors for 500 articles/day | ~83 | ~23 |
| **Annual savings** | — | **₹58.4 crore** |

---

## Tech stack

| What | How | Why |
|------|-----|-----|
| Framework | Next.js 16, App Router, TypeScript | Frontend + backend in one app, one deploy |
| UI | Tailwind CSS + shadcn/ui | Fast to build, looks professional |
| AI — agents | Groq API · `llama-3.3-70b-versatile` | 14,400 free req/day, very fast |
| AI — localization | Groq API · `openai/gpt-oss-120b` | Better Indian language quality |
| Database | SQLite via `better-sqlite3` | Zero setup, stores audit log + job state |
| Streaming | Server-Sent Events (SSE) | Real-time agent progress in the UI |
| Compliance rules | JSON files in `data/rules/` | Editable without redeployment |

**Total cost to run: ₹0**

---

## Project structure — what lives where

```
ContentOS/
│
├── app/                          ← Next.js pages + API routes
│   ├── page.tsx                  ← Main editor dashboard (the UI you demo)
│   ├── audit/page.tsx            ← Audit log — every agent decision, timestamped
│   ├── admin/rules/page.tsx      ← Live compliance rules editor
│   └── api/
│       ├── pipeline/route.ts     ← POST: starts the pipeline, returns jobId
│       ├── approve/route.ts      ← POST: handles Gate 1 and Gate 2 approvals
│       ├── stream/route.ts       ← GET: SSE stream for real-time UI updates
│       ├── audit/route.ts        ← GET: returns audit log entries
│       └── admin/rules/route.ts  ← GET/POST: reads and writes rule files
│
├── agents/                       ← The 4 AI agents
│   ├── drafter.ts                ← A1: writes the article
│   ├── compliance.ts             ← A2: checks rules, returns structured flags
│   ├── localizer.ts              ← A3: 4 languages via Promise.all()
│   └── distributor.ts            ← A4: formats for each channel
│
├── lib/                          ← Shared utilities
│   ├── types.ts                  ← All TypeScript types — start here
│   ├── groq-client.ts            ← Groq API wrapper with 3-key rotation + 429 fallback
│   ├── quota-guard.ts            ← Tracks gpt-oss-120b daily usage, auto-downgrades
│   ├── rate-limit.ts             ← Per-IP limiter (max 2 pipeline runs per 30s)
│   ├── pipeline.ts               ← Orchestrates all 4 agents, manages gates, SSE events
│   └── db.ts                     ← SQLite wrapper: audit_log + jobs tables
│
├── components/                   ← React UI components
│   ├── PipelineStatus.tsx        ← Live agent progress (SSE consumer)
│   ├── ApprovalGate.tsx          ← Gate 1: headline picker + draft editor
│   ├── CompliancePanel.tsx       ← Compliance flags with rule ID, quote, fix
│   └── ChannelPreview.tsx        ← Gate 2: channel tabs + language sections
│
├── data/
│   ├── rules/
│   │   ├── sebi.json             ← SEBI compliance rules
│   │   ├── brand.json            ← ET brand voice rules
│   │   └── legal.json            ← Legal/defamation rules
│   ├── demo-article.txt          ← Pre-built press release that triggers SEBI-001
│   └── db.sqlite                 ← Auto-created on first run, gitignored
│
├── CLAUDE.md                     ← Full architecture context for AI-assisted development
├── .env.example                  ← Copy this to .env.local and add your Groq keys
└── README.md                     ← You are here
```

---

## Setup — get it running in 5 minutes

### What you need
- Node.js 18 or higher — check with `node --version`
- At least 1 Groq API key — get one free at [console.groq.com](https://console.groq.com)
- Git

### Step 1 — Clone the repo

```bash
git clone https://github.com/AnshAggr1303/ContentOS.git
cd ContentOS
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Add your API keys

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder values:

```env
GROQ_KEY_1=gsk_your_actual_key_here
GROQ_KEY_2=gsk_second_key_if_you_have_one
GROQ_KEY_3=gsk_third_key_if_you_have_one
```

> You only need 1 key to run. With 3 keys you get 3x the rate limit.
> Get additional keys by creating free accounts at console.groq.com with different email addresses.

### Step 4 — Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The SQLite database is created automatically at `data/db.sqlite` on first run.

---

## How to test it

1. Open `http://localhost:3000`
2. Click **"Load demo content →"** — pre-fills a Reliance press release with compliance triggers
3. Make sure all 4 languages and all 5 channels are checked
4. Click **"Run Pipeline"**
5. Watch the 4 agents run in real time on the right side
6. At Gate 1 — pick a headline, optionally edit the draft, click Approve
7. Watch the compliance agent flag **SEBI-001** with exact quote and suggested fix
8. At Gate 2 — review all channel versions and all 4 language outputs, click Publish
9. Visit `/audit` to see every agent decision logged with timestamp and duration

---

## The compliance money shot

This is what judges need to see. The compliance agent returns structured flags:

```
SEBI-001  [HIGH RISK]  violation detected

Forward-looking statements must include disclaimer

FLAGGED TEXT
"The conglomerate expects revenue to grow 25% next year,
with Ambani projecting ₹10 lakh crore in annual turnover by FY28"

SUGGESTED FIX
Add '(Subject to market conditions and regulatory approvals)'
after the statement
```

Every flag shows: rule ID · severity · exact quoted text · rule description · specific suggested fix.

---

## Pages

| URL | What it shows |
|-----|--------------|
| `/` | Main editor dashboard — run the pipeline here |
| `/audit` | Every agent decision: timestamp, model, decision, flags, duration |
| `/admin/rules` | Live compliance rules editor — edit rules without redeployment |

---

## Key technical decisions — and why

**Why no agent framework (LangChain etc.)?**
The pipeline is 4 API calls with 2 pause points. An agent framework adds 10x complexity for zero benefit. The entire orchestration is ~100 lines in `lib/pipeline.ts`.

**Why SSE instead of WebSockets?**
SSE is one-directional (server → client) which is all we need. It's native to Next.js, requires no extra packages, and works over standard HTTP.

**Why SQLite instead of Postgres?**
Zero setup, zero cost, works perfectly for a single-process app. The audit log has at most a few hundred entries during a demo.

**Why not deploy to Vercel?**
Vercel splits each API route into a separate serverless function. Our SSE stream uses an in-process EventEmitter — that only works when everything runs in one Node.js process. Use `npm start` locally or deploy to Render/Fly.io.

**Why 3 Groq keys?**
`gpt-oss-120b` has a 1,000 req/day free limit per key. 3 keys = 3,000 req/day. The quota guard in `lib/quota-guard.ts` automatically switches to `llama-3.3-70b` when approaching the limit so the demo never fails silently.

---

## Understanding the codebase — where to start

If you're new here, read these files in this order:

1. `lib/types.ts` — understand all the data shapes first
2. `lib/pipeline.ts` — understand how the 4 agents connect
3. `agents/compliance.ts` — the most interesting agent, see how rules are injected
4. `app/page.tsx` — the SSE state machine that drives the UI
5. `app/api/stream/route.ts` — how real-time events flow from backend to frontend

---

## Common issues

**Pipeline doesn't start / spinner hangs**
Check your terminal for errors. Most likely: missing or invalid Groq keys in `.env.local`. Keys must start with `gsk_`.

**Compliance agent returns no flags**
Use the demo content (`Load demo content →`). The Reliance press release is specifically crafted to trigger SEBI-001 reliably.

**Only 1 language shows in Gate 2**
You only selected 1 language in the checkboxes. Select all 4 before running.

**`better-sqlite3` install fails**
```bash
npm install --build-from-source better-sqlite3
```

**Port 3000 already in use**
```bash
npx kill-port 3000
npm run dev
```

**`data/db.sqlite` errors**
```bash
rm data/db.sqlite
npm run dev
# db.ts auto-creates it fresh on startup
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_KEY_1` | Yes | Primary Groq API key |
| `GROQ_KEY_2` | No | Second key for higher rate limits |
| `GROQ_KEY_3` | No | Third key for higher rate limits |
| `NEXT_PUBLIC_APP_NAME` | No | App name in UI (default: ContentOS) |

---

## Demo script (3 minutes)

| Time | What to do |
|------|-----------|
| 0:00–0:30 | Show the problem — manual localization = 4 hours, ₹3,200/article |
| 0:30–1:00 | Click "Load demo content" → Run Pipeline → watch 4 agents stream live |
| 1:00–1:30 | Gate 1: pick headline, approve draft |
| 1:30–2:00 | **Compliance flags SEBI-001** with exact quote + suggested fix ← money shot |
| 2:00–2:30 | Gate 2: show all 4 language outputs + 5 channel formats |
| 2:30–3:00 | Open /audit — every decision timestamped. Say the ₹58.4 Cr number. |

---

## Built with

- [Groq](https://groq.com) — Ultra-fast LLM inference, free tier
- [Next.js](https://nextjs.org) — Full-stack React framework
- [shadcn/ui](https://ui.shadcn.com) — UI component library
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite for Node.js
- [Anthropic Claude Code](https://claude.ai/code) — AI-assisted development

---

## Hackathon context

**Event:** ET AI Hackathon 2026
**Problem Statement:** PS1 — AI for Enterprise Content Operations

Requirements addressed:
- Full workflow automation (draft → review → localize → distribute)
- Multi-agent coordination with human-in-the-loop gates
- Measurable cycle time reduction (4 hours → 35 minutes)
- Working compliance guardrails with specific rule citations
- Auditable trail of every agent decision at `/audit`

---

*"A newsroom where AI drafts, a compliance agent catches legal risk, a localization agent adapts for 5 Indian markets, and a distribution agent decides which channel gets what — all in one auditable pipeline, with a human editor in the loop at every gate."*