"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  ContentType,
  Language,
  Channel,
  AgentName,
  ComplianceResult,
  ChannelOutputMap,
} from "@/lib/types";
import PipelineStatus, { type AgentProgress } from "@/components/PipelineStatus";
import ApprovalGate from "@/components/ApprovalGate";
import CompliancePanel from "@/components/CompliancePanel";
import ChannelPreview from "@/components/ChannelPreview";

// ── Types ──────────────────────────────────────────

type Phase =
  | "idle"
  | "running"
  | "gate_1"
  | "compliance"
  | "gate_2"
  | "complete"
  | "failed";

// ── Constants ──────────────────────────────────────

const INITIAL_AGENTS: AgentProgress[] = [
  { name: "drafter", displayName: "Drafter", status: "waiting" },
  { name: "compliance", displayName: "Compliance", status: "waiting" },
  { name: "localizer", displayName: "Localizer", status: "waiting" },
  { name: "distributor", displayName: "Distributor", status: "waiting" },
];

const AGENT_CARD_INFO: Record<
  AgentName,
  { num: string; desc: string; model: string; icon: string }
> = {
  drafter: {
    num: "Agent 01",
    desc: "Structural decomposition and narrative synthesis based on editorial style guides.",
    model: "llama-3.3-70b",
    icon: "edit_note",
  },
  compliance: {
    num: "Agent 02",
    desc: "Legal oversight, fact-checking verification, and trademark protection analysis.",
    model: "llama-3.3-70b",
    icon: "policy",
  },
  localizer: {
    num: "Agent 03",
    desc: "Transcreation into 4 regional languages with cultural nuance and dialect accuracy.",
    model: "gpt-oss-120b",
    icon: "translate",
  },
  distributor: {
    num: "Agent 04",
    desc: "Multi-channel optimization for SEO, social platforms, and push notifications.",
    model: "llama-3.3-70b",
    icon: "rocket_launch",
  },
};

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "news", label: "News" },
  { value: "analysis", label: "Analysis" },
  { value: "explainer", label: "Explainer" },
  { value: "opinion", label: "Opinion" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "hi", label: "हिन्दी" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "bn", label: "বাংলা" },
];

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "et_web", label: "ET Web" },
  { value: "et_app", label: "ET App" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
];

const AGENT_NAMES: AgentName[] = ["drafter", "compliance", "localizer", "distributor"];

// ── Helpers ────────────────────────────────────────

function formatElapsed(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── Main Page ──────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // Form state
  const [input, setInput] = useState("");
  const [contentType, setContentType] = useState<ContentType>("news");
  const [wordCount, setWordCount] = useState(400);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(["hi", "ta", "te", "bn"]);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([
    "et_web", "et_app", "whatsapp", "linkedin", "newsletter",
  ]);

  // Pipeline state
  const [phase, setPhase] = useState<Phase>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentProgress[]>(INITIAL_AGENTS);
  const [draft, setDraft] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<string[] | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [channelOutputs, setChannelOutputs] = useState<Partial<ChannelOutputMap> | null>(null);
  const [localizations, setLocalizations] = useState<Record<Language, string> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bufferedGate2, setBufferedGate2] = useState<{
    channels: Partial<ChannelOutputMap>;
    localizations: Record<Language, string>;
  } | null>(null);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // ── Timer helpers ──────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopTimer(); esRef.current?.close(); }, [stopTimer]);

  // ── Auto-redirect on complete ──────────────────────

  useEffect(() => {
    if (phase !== "complete") return;
    const id = setTimeout(() => router.push("/audit"), 2000);
    return () => clearTimeout(id);
  }, [phase, router]);

  // ── SSE connection ────────────────────────────────

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/stream?jobId=${jobId}`);
    esRef.current = es;

    const updateAgent = (name: AgentName, updates: Partial<AgentProgress>) => {
      setAgents((prev) => prev.map((a) => (a.name === name ? { ...a, ...updates } : a)));
    };

    es.addEventListener("agent_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as { agent: AgentName; model: string };
      updateAgent(data.agent, { status: "running", model: data.model });
    });

    es.addEventListener("agent_complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        agent: AgentName;
        duration_ms: number;
        result?: ComplianceResult;
      };
      updateAgent(data.agent, { status: "complete", durationMs: data.duration_ms });
      if (data.agent === "compliance" && data.result) {
        setComplianceResult(data.result);
        setPhase("compliance");
        stopTimer();
      }
    });

    // Fallback: separate compliance_result event
    es.addEventListener("compliance_result", (e: MessageEvent) => {
      const result = JSON.parse(e.data as string) as ComplianceResult;
      setComplianceResult(result);
      setPhase("compliance");
      stopTimer();
    });

    es.addEventListener("gate_1", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as { draft: string; headlines: string[] };
      setDraft(data.draft);
      setHeadlines(data.headlines);
      setPhase("gate_1");
      stopTimer();
    });

    es.addEventListener("gate_2", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        channels: Partial<ChannelOutputMap>;
        localizations: Record<Language, string>;
      };
      setChannelOutputs(data.channels);
      setLocalizations(data.localizations);
      setBufferedGate2({ channels: data.channels, localizations: data.localizations });
      // Do NOT transition to gate_2 yet — wait for user to click Continue
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      const _data = JSON.parse(e.data as string) as { job_id: string; total_duration_ms: number };
      void _data;
      setPhase("complete");
      stopTimer();
      es.close();
      setTimeout(() => router.push("/audit"), 2000);
    });

    es.addEventListener("error", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as { message?: string };
      setErrorMessage(data.message ?? "An unexpected error occurred.");
      setPhase("failed");
      stopTimer();
      es.close();
    });

    es.addEventListener("pipeline_rejected", () => {
      resetPipelineState();
      setPhase("idle");
      stopTimer();
      es.close();
    });

    es.onerror = () => {
      // SSE will auto-reconnect; ignore transient errors
    };

    return () => { es.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // ── State reset ───────────────────────────────────

  function resetPipelineState() {
    setJobId(null);
    setDraft(null);
    setHeadlines(null);
    setSelectedHeadline(null);
    setComplianceResult(null);
    setChannelOutputs(null);
    setLocalizations(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setAgents(INITIAL_AGENTS);
    setBufferedGate2(null);
  }

  // ── Handlers ──────────────────────────────────────

  const handleRunPipeline = async () => {
    if (!input.trim() || isSubmitting) return;
    setIsSubmitting(true);
    resetPipelineState();
    setPhase("running");

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          contentType,
          wordCount,
          selectedLanguages,
          selectedChannels,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to start pipeline");
      }
      const { jobId: newJobId } = (await res.json()) as { jobId: string };
      setJobId(newJobId);
      startTimer();
    } catch (err: unknown) {
      setPhase("failed");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveGate1 = (headline: string, editedDraft: string) => {
    setDraft(editedDraft);
    setSelectedHeadline(headline);
    setPhase("running");
    startTimer();
  };

  const handleRejectGate1 = () => {
    resetPipelineState();
    setPhase("idle");
    stopTimer();
  };

  const handleContinueFromCompliance = () => {
    if (bufferedGate2) {
      setPhase("gate_2");
    } else {
      setPhase("running");
      startTimer();
    }
  };

  const handleApplyFix = (quote: string, fix: string) => {
    setDraft((prev) => {
      if (!prev) return prev;

      // Try exact match first
      if (prev.includes(quote)) {
        return prev.replace(quote, fix);
      }

      // Fallback: try trimmed version
      const trimmedQuote = quote.trim();
      if (prev.includes(trimmedQuote)) {
        return prev.replace(trimmedQuote, fix);
      }

      // Last resort: find longest matching substring
      // Split quote into words, find in draft
      const words = trimmedQuote.split(' ').filter((w) => w.length > 4);
      const anchor = words.slice(0, 5).join(' ');
      const anchorIdx = prev.indexOf(anchor);
      if (anchorIdx !== -1) {
        // Find the sentence containing the anchor
        const sentenceStart = prev.lastIndexOf('.', anchorIdx) + 1;
        const sentenceEnd = prev.indexOf('.', anchorIdx) + 1;
        const sentence = prev.slice(sentenceStart, sentenceEnd);
        return prev.replace(sentence, ' ' + fix + '.');
      }

      // If nothing matches, return unchanged
      // (Apply button will still show Applied state)
      return prev;
    });
  };

  const handlePublish = () => {
    setPhase("complete");
  };

  const handleLoadDemo = async () => {
    try {
      const res = await fetch("/api/demo");
      const data = (await res.json()) as { content: string };
      setInput(data.content);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  // ── Shared: Metrics Bar ────────────────────────────

  const isRunning = phase === "running";

  const MetricsBar = () => (
    <header className="sticky top-0 h-14 bg-white shadow-sm flex justify-between items-center px-10 z-40">
      <div className="flex items-center gap-8">
        <span className="text-[#1A1A1A] font-headline font-bold text-lg">Economic Times AI</span>
        <div className="hidden lg:flex items-center gap-6 font-technical text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-container">schedule</span>
            Draft to publish: ~35 min
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-container">payments</span>
            Saved: ₹3,200
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-container">verified</span>
            Compliance: 94%
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-container">trending_up</span>
            Savings: ₹58.4 Cr
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container">
            <span className="w-2 h-2 rounded-full bg-[#059669] pulse-green" />
            <span className="font-technical text-[13px] text-slate-600">
              Pipeline running · {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>
    </header>
  );

  // ── Shared: Input Form ────────────────────────────

  const isFormDisabled = phase !== "idle" && phase !== "failed";
  const wordCountDisplay = input.trim() ? input.trim().split(/\s+/).length : 0;

  const InputForm = () => (
    <div className="space-y-6">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isFormDisabled}
          placeholder="Paste press release, brief, or report here..."
          className="w-full h-64 p-6 bg-surface-container-low border border-outline-variant/20 rounded-lg font-body text-base focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all resize-none outline-none placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="absolute bottom-4 right-4 font-technical text-[11px] text-slate-400">
          {wordCountDisplay} words
        </div>
      </div>
      <button
        onClick={handleLoadDemo}
        disabled={isFormDisabled}
        className="font-label text-[12px] text-primary-container hover:underline inline-flex items-center gap-1 disabled:opacity-40"
      >
        Load demo content
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>

      {/* Controls */}
      <div className="space-y-6 pt-2">
        {/* Content Type */}
        <div className="space-y-3">
          <label className="font-label text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase">
            Content Type
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => !isFormDisabled && setContentType(value)}
                disabled={isFormDisabled}
                className={`px-4 py-1.5 rounded-full font-label text-xs font-medium transition-colors ${
                  contentType === value
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-white border border-outline-variant/30 text-slate-600 hover:border-primary-container"
                } disabled:opacity-60`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Word Count */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-label text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase">
              Word Count
            </label>
            <span className="font-technical text-xs font-semibold text-primary-container">
              {wordCount} words
            </span>
          </div>
          <input
            type="range"
            min={200}
            max={800}
            value={wordCount}
            onChange={(e) => !isFormDisabled && setWordCount(Number(e.target.value))}
            disabled={isFormDisabled}
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary-container disabled:opacity-60"
          />
        </div>

        {/* Language + Channels */}
        <div className="grid grid-cols-2 gap-8">
          {/* Languages */}
          <div className="space-y-3">
            <label className="font-label text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase">
              Localize To
            </label>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              {LANGUAGES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(value)}
                    onChange={() => !isFormDisabled && toggleLanguage(value)}
                    disabled={isFormDisabled}
                    className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
                  />
                  <span className="font-technical text-[11px]">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-3">
            <label className="font-label text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase">
              Publish Channels
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => !isFormDisabled && toggleChannel(value)}
                  disabled={isFormDisabled}
                  className={`px-2 py-0.5 rounded font-label text-[9px] font-bold uppercase tracking-tighter transition-colors ${
                    selectedChannels.includes(value)
                      ? "bg-primary-container/10 text-primary-container"
                      : "bg-surface-container text-slate-400"
                  } disabled:opacity-60`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Run Pipeline Button */}
      <button
        onClick={handleRunPipeline}
        disabled={isFormDisabled || !input.trim() || isSubmitting}
        className="w-full h-12 bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center gap-2 border-l-4 border-primary-container transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting || phase === "running" ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            <span className="font-label font-semibold text-sm uppercase tracking-widest">
              Running...
            </span>
          </>
        ) : (
          <>
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
            <span className="font-label font-semibold text-sm uppercase tracking-widest">
              Run Pipeline
            </span>
          </>
        )}
      </button>
    </div>
  );

  // ── Phase: gate_1 ─────────────────────────────────

  if (phase === "gate_1" && draft && headlines) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <MetricsBar />
        <ApprovalGate
          jobId={jobId!}
          draft={draft}
          headlines={headlines}
          onApproved={handleApproveGate1}
          onRejected={handleRejectGate1}
        />
      </div>
    );
  }

  // ── Phase: compliance ─────────────────────────────

  if (phase === "compliance" && complianceResult) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <MetricsBar />
        <CompliancePanel
          result={complianceResult}
          draft={draft ?? ""}
          onApplyFix={handleApplyFix}
          onContinue={handleContinueFromCompliance}
        />
      </div>
    );
  }

  // ── Phase: gate_2 ─────────────────────────────────

  if (phase === "gate_2" && channelOutputs && localizations) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <MetricsBar />
        <ChannelPreview
          jobId={jobId!}
          channels={channelOutputs}
          localizations={localizations}
          onPublished={handlePublish}
        />
      </div>
    );
  }

  // ── Phase: complete ───────────────────────────────

  if (phase === "complete") {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <MetricsBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <span
              className="material-symbols-outlined text-[#059669]"
              style={{ fontSize: "64px", fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h2 className="font-headline text-[32px] font-semibold text-on-background">
              Published Successfully
            </h2>
            <p className="font-label text-sm text-slate-500">
              Redirecting to audit log...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: failed ─────────────────────────────────

  if (phase === "failed") {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <MetricsBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontSize: "64px", fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
            <h2 className="font-headline text-[32px] font-semibold text-on-background">
              Pipeline Failed
            </h2>
            <p className="font-label text-sm text-slate-500">{errorMessage}</p>
            <button
              onClick={() => { resetPipelineState(); setPhase("idle"); }}
              className="mt-4 bg-[#1A1A1A] text-white border-l-4 border-primary-container px-8 py-3 rounded-lg font-label font-semibold text-sm hover:bg-black transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: idle / running ─────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <MetricsBar />

      <div className="flex-1 p-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
          {/* Left 40%: Input */}
          <section className="md:w-[40%] space-y-8">
            <div>
              <h2 className="font-headline text-[28px] font-semibold text-[#1A1A1A] leading-tight mb-2">
                Compose Narrative
              </h2>
              <p className="font-label text-sm text-[#6B7280]">
                Paste your source material to trigger the 4-agent editorial pipeline.
              </p>
            </div>
            <InputForm />
          </section>

          {/* Right 60%: Agents */}
          <section className="md:flex-1 space-y-8">
            {phase === "running" ? (
              <>
                <div className="pb-4">
                  <h3 className="font-headline text-[28px] font-bold text-on-surface">
                    Pipeline Status
                  </h3>
                  <p className="font-body text-slate-500 mt-1">
                    Orchestrating editorial agents in real-time.
                  </p>
                </div>
                <PipelineStatus agents={agents} />
              </>
            ) : (
              <>
                <div className="pb-4 border-b border-outline-variant/10">
                  <h2 className="font-headline text-[28px] font-semibold text-[#1A1A1A] leading-tight mb-2">
                    Ready to Process
                  </h2>
                  <p className="font-label text-sm text-[#6B7280]">
                    Your content will pass through 4 specialist AI agents before reaching publication.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {AGENT_NAMES.map((name) => {
                    const info = AGENT_CARD_INFO[name];
                    return (
                      <div
                        key={name}
                        className="bg-white p-6 rounded-xl border border-outline-variant/10 hover:shadow-md transition-shadow group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-low rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-50" />
                        <div className="relative z-10">
                          <header className="flex justify-between items-start mb-4">
                            <span className="font-technical text-[10px] text-primary-container font-bold tracking-widest uppercase">
                              {info.num}
                            </span>
                            <span className="material-symbols-outlined text-slate-300">
                              {info.icon}
                            </span>
                          </header>
                          <h3 className="font-label text-base font-bold text-[#1A1A1A] mb-2 capitalize">
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </h3>
                          <p className="font-label text-[13px] text-[#6B7280] mb-4 leading-relaxed">
                            {info.desc}
                          </p>
                          <footer className="pt-4 border-t border-surface-container flex justify-between items-center">
                            <span className="font-technical text-[10px] text-[#9CA3AF]">
                              {info.model}
                            </span>
                          </footer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
