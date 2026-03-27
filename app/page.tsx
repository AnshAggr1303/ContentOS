"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import type {
  ContentType,
  Language,
  Channel,
  AgentName,
  ComplianceFlag,
  ComplianceResult,
  ChannelOutputMap,
  RiskLevel,
} from "@/lib/types";
import PipelineStatus, {
  type AgentProgress,
} from "@/components/PipelineStatus";
import ApprovalGate from "@/components/ApprovalGate";
import CompliancePanel from "@/components/CompliancePanel";
import ChannelPreview from "@/components/ChannelPreview";
import {
  Clock,
  TrendingUp,
  Zap,
  IndianRupee,
  Play,
  Loader2,
  RotateCcw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

type Phase =
  | "idle"
  | "running"
  | "gate_1"
  | "gate_2"
  | "complete"
  | "failed";

interface Gate1Data {
  draft: string;
  headlines: string[];
}

interface Gate2Data {
  channels: Partial<ChannelOutputMap>;
  localizations: Partial<Record<Language, string>>;
}

// ── Constants ──────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "news", label: "News" },
  { value: "analysis", label: "Analysis" },
  { value: "explainer", label: "Explainer" },
  { value: "opinion", label: "Opinion" },
];

const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "hi", label: "Hindi", native: "हिन्दी" },
  { value: "ta", label: "Tamil", native: "தமிழ்" },
  { value: "te", label: "Telugu", native: "తెలుగు" },
  { value: "bn", label: "Bengali", native: "বাংলা" },
];

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "et_web", label: "ET Web" },
  { value: "et_app", label: "ET App" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
];

const INITIAL_AGENTS: AgentProgress[] = [
  { name: "drafter", displayName: "A1 — Drafter", status: "waiting" },
  { name: "compliance", displayName: "A2 — Compliance", status: "waiting" },
  { name: "localizer", displayName: "A3 — Localizer", status: "waiting" },
  { name: "distributor", displayName: "A4 — Distributor", status: "waiting" },
];

// ── Metrics bar ────────────────────────────────────

function MetricsBar() {
  const metrics = [
    {
      icon: Clock,
      label: "Draft-to-publish",
      value: "~35 min",
      sub: "vs 4 hrs manual",
      color: "#E8820C",
    },
    {
      icon: TrendingUp,
      label: "Localization savings",
      value: "₹3,200",
      sub: "per article",
      color: "#059669",
    },
    {
      icon: Zap,
      label: "Compliance catch rate",
      value: "94%",
      sub: "vs 60% manual",
      color: "#E8820C",
    },
    {
      icon: IndianRupee,
      label: "Annual savings",
      value: "₹58.4 Cr",
      sub: "500 articles/day",
      color: "#059669",
    },
  ];

  return (
    <div
      className="shrink-0 flex items-center gap-0 border-b overflow-x-auto"
      style={{ background: "#FFFFFF", borderColor: "#EBEBEB" }}
    >
      <div
        className="px-6 py-3 border-r shrink-0"
        style={{ borderColor: "#EBEBEB" }}
      >
        <h1
          className="text-base font-semibold text-zinc-900 whitespace-nowrap"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Editor Dashboard
        </h1>
      </div>
      {metrics.map(({ icon: Icon, label, value, sub, color }, i) => (
        <React.Fragment key={label}>
          <div
            className="px-5 py-3 flex items-center gap-2.5 shrink-0"
          >
            <Icon size={13} style={{ color }} className="shrink-0" />
            <div>
              <p
                className="text-[10px] whitespace-nowrap"
                style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
              >
                {label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: "#1A1A1A", fontFamily: "var(--font-dm-mono)" }}
                >
                  {value}
                </span>
                <span
                  className="text-[10px] whitespace-nowrap"
                  style={{ color: "#C0C0C8", fontFamily: "var(--font-dm-mono)" }}
                >
                  {sub}
                </span>
              </div>
            </div>
          </div>
          {i < metrics.length - 1 && (
            <div
              className="w-px h-8 shrink-0"
              style={{ background: "#EBEBEB" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Demo content ───────────────────────────────────

const DEMO_CONTENT = `Reliance Industries Limited today announced record quarterly profits of ₹19,641 crore for Q3 FY26, up 11.2% year-on-year, driven by strong performance across its retail, telecom, and oil-to-chemicals businesses. Chairman Mukesh Ambani expects revenue to grow 25% next year, projecting the conglomerate will reach ₹10 lakh crore in annual turnover by FY28. The company's Jio Platforms unit added 8.2 million subscribers in the quarter, taking total subscriber base to 471 million. Reliance Retail clocked revenues of ₹73,246 crore, a 15% increase. The board has approved a ₹50,000 crore capex plan for FY27, focused on green energy and 5G network densification. Analysts at Goldman Sachs have upgraded the stock to a 'strong buy' with a 12-month price target of ₹3,400.`;

// ── Main page ──────────────────────────────────────

export default function DashboardPage() {
  // Form state
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<ContentType>("news");
  const [wordCount, setWordCount] = useState(400);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([
    "hi",
    "ta",
    "te",
    "bn",
  ]);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([
    "et_web",
    "et_app",
    "whatsapp",
    "linkedin",
    "newsletter",
  ]);

  // Pipeline state
  const [jobId, setJobId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [agents, setAgents] = useState<AgentProgress[]>(INITIAL_AGENTS);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);
  const [complianceOverallRisk, setComplianceOverallRisk] =
    useState<RiskLevel>("low");
  const [complianceStatus, setComplianceStatus] = useState<"PASS" | "FLAG">(
    "PASS"
  );
  const [gate1Data, setGate1Data] = useState<Gate1Data | null>(null);
  const [gate2Data, setGate2Data] = useState<Gate2Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SSE connection
  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/stream?jobId=${jobId}`);

    const updateAgent = (name: AgentName, updates: Partial<AgentProgress>) => {
      setAgents((prev) =>
        prev.map((a) => (a.name === name ? { ...a, ...updates } : a))
      );
    };

    es.addEventListener("agent_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        agent: AgentName;
        model: string;
      };
      updateAgent(data.agent, { status: "running", model: data.model });
    });

    es.addEventListener("agent_complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        agent: AgentName;
        duration_ms: number;
      };
      updateAgent(data.agent, {
        status: "complete",
        durationMs: data.duration_ms,
      });
    });

    es.addEventListener("gate_1", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as Gate1Data;
      setGate1Data(data);
      setPhase("gate_1");
    });

    es.addEventListener("compliance_flag", (e: MessageEvent) => {
      const flag = JSON.parse(e.data as string) as ComplianceFlag;
      setComplianceFlags((prev) => [...prev, flag]);
      setComplianceStatus("FLAG");
      if (flag.severity === "high") {
        setComplianceOverallRisk("high");
      } else if (flag.severity === "medium") {
        setComplianceOverallRisk((prev) =>
          prev === "high" ? "high" : "medium"
        );
      }
    });

    // Full compliance result (backend may emit this after all flags)
    es.addEventListener("compliance_result", (e: MessageEvent) => {
      const result = JSON.parse(e.data as string) as ComplianceResult;
      setComplianceFlags(result.flags);
      setComplianceOverallRisk(result.overall_risk);
      setComplianceStatus(result.status);
    });

    es.addEventListener("gate_2", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as Gate2Data;
      setGate2Data(data);
      setPhase("gate_2");
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as {
        job_id: string;
        total_duration_ms: number;
      };
      setTotalDuration(data.total_duration_ms);
      setPhase("complete");
      es.close();
    });

    es.addEventListener("pipeline_rejected", () => {
      setPhase("idle");
      setJobId(null);
      setAgents(INITIAL_AGENTS);
      setComplianceFlags([]);
      setComplianceOverallRisk("low");
      setComplianceStatus("PASS");
      setGate1Data(null);
      setGate2Data(null);
      es.close();
    });

    es.addEventListener("pipeline_error", (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as { error: string };
      setPhase("failed");
      setErrorMessage(data.error ?? "Pipeline failed");
      es.close();
    });

    es.onerror = () => {
      // EventSource will auto-reconnect; only mark failed after extended silence
      console.warn("SSE connection interrupted — awaiting reconnect");
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  // Track compliance agent completion to derive PASS status
  useEffect(() => {
    const complianceAgent = agents.find((a) => a.name === "compliance");
    if (complianceAgent?.status === "complete" && complianceFlags.length === 0) {
      setComplianceStatus("PASS");
    }
  }, [agents, complianceFlags.length]);

  // ── Handlers ────────────────────────────────────

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setPhase("running");
    setAgents(INITIAL_AGENTS);
    setComplianceFlags([]);
    setComplianceOverallRisk("low");
    setComplianceStatus("PASS");
    setGate1Data(null);
    setGate2Data(null);
    setTotalDuration(null);
    setErrorMessage(null);
    setJobId(null);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: content,
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
    } catch (err: unknown) {
      setPhase("failed");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGate1Approved = () => {
    setGate1Data(null);
    setPhase("running");
  };

  const handleGate1Rejected = () => {
    setPhase("idle");
    setJobId(null);
    setAgents(INITIAL_AGENTS);
  };

  const handleGate2Approved = () => {
    setPhase("complete");
  };

  const handleReset = () => {
    setPhase("idle");
    setJobId(null);
    setAgents(INITIAL_AGENTS);
    setComplianceFlags([]);
    setComplianceStatus("PASS");
    setGate1Data(null);
    setGate2Data(null);
    setContent("");
    setErrorMessage(null);
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

  // ── Derived display state ────────────────────────

  const complianceAgent = agents.find((a) => a.name === "compliance");
  const showCompliancePanel =
    complianceAgent?.status === "complete" || complianceFlags.length > 0;

  const isFormDisabled = phase !== "idle" && phase !== "failed";

  // ── Right panel rendering ────────────────────────

  const renderRightPanel = () => {
    if (phase === "idle") {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center px-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
            style={{ background: "#FFFFFF", border: "1px solid #EBEBEB" }}
          >
            <Play size={22} style={{ color: "#E8820C" }} className="ml-0.5" />
          </div>
          <h2
            className="text-xl font-semibold text-zinc-700 mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Ready to Process
          </h2>
          <p
            className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Paste a press release or brief, configure your settings on the
            left, and click Run Pipeline.
          </p>

          {/* Agent overview cards */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
            {[
              {
                step: "01",
                label: "Drafter",
                desc: "llama-3.3-70b crafts full ET article",
              },
              {
                step: "02",
                label: "Compliance",
                desc: "SEBI, brand & legal rule check",
              },
              {
                step: "03",
                label: "Localizer",
                desc: "4 Indian languages in parallel",
              },
              {
                step: "04",
                label: "Distributor",
                desc: "5 channel-specific formats",
              },
            ].map(({ step, label, desc }) => (
              <div
                key={step}
                className="rounded-xl p-3"
                style={{ background: "#FFFFFF", border: "1px solid #EBEBEB" }}
              >
                <p
                  className="text-[10px] mb-1"
                  style={{
                    color: "#D0D0D0",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  AGENT {step}
                </p>
                <p
                  className="text-sm font-medium text-zinc-700 mb-0.5"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {label}
                </p>
                <p
                  className="text-xs text-zinc-400"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (phase === "gate_1" && gate1Data) {
      return (
        <ApprovalGate
          jobId={jobId!}
          draft={gate1Data.draft}
          headlines={gate1Data.headlines}
          onApproved={handleGate1Approved}
          onRejected={handleGate1Rejected}
        />
      );
    }

    if (phase === "gate_2" && gate2Data) {
      return (
        <>
          {showCompliancePanel && (
            <div className="mb-5">
              <CompliancePanel
                flags={complianceFlags}
                status={complianceStatus}
                overallRisk={complianceOverallRisk}
              />
            </div>
          )}
          <ChannelPreview
            jobId={jobId!}
            channels={gate2Data.channels}
            localizations={gate2Data.localizations}
            onApproved={handleGate2Approved}
          />
        </>
      );
    }

    if (phase === "complete") {
      return (
        <>
          {/* Success banner */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 animate-fade-up"
            style={{
              background: "rgba(5,150,105,0.06)",
              border: "1px solid rgba(5,150,105,0.2)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shrink-0"
              style={{ background: "#059669" }}
            >
              ✓
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "#065F46" }}
              >
                Pipeline Complete
              </p>
              {totalDuration && (
                <p
                  className="text-[11px] mt-0.5"
                  style={{
                    color: "#6EE7B7",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  Total: {(totalDuration / 1000).toFixed(1)}s · Job: {jobId}
                </p>
              )}
            </div>
          </div>

          {showCompliancePanel && (
            <div className="mb-5">
              <CompliancePanel
                flags={complianceFlags}
                status={complianceStatus}
                overallRisk={complianceOverallRisk}
              />
            </div>
          )}

          {gate2Data && (
            <ChannelPreview
              jobId={jobId!}
              channels={gate2Data.channels}
              localizations={gate2Data.localizations}
              onApproved={() => {}}
            />
          )}
        </>
      );
    }

    if (phase === "failed") {
      return (
        <div
          className="px-5 py-4 rounded-xl animate-fade-up"
          style={{
            background: "rgba(220,38,38,0.05)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          <p className="font-semibold text-sm" style={{ color: "#991B1B" }}>
            Pipeline Failed
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "#B91C1C", fontFamily: "var(--font-dm-mono)" }}
          >
            {errorMessage ?? "An unexpected error occurred."}
          </p>
        </div>
      );
    }

    // Running phase: show agent progress + compliance panel when available
    return (
      <>
        <PipelineStatus agents={agents} />
        {showCompliancePanel && (
          <div className="mt-5">
            <CompliancePanel
              flags={complianceFlags}
              status={complianceStatus}
              overallRisk={complianceOverallRisk}
            />
          </div>
        )}
      </>
    );
  };

  // ── Render ────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MetricsBar />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left panel: Input form ───────────────── */}
        <div
          className="w-[390px] shrink-0 flex flex-col overflow-y-auto border-r"
          style={{ background: "#FFFFFF", borderColor: "#EBEBEB" }}
        >
          <div className="p-5 space-y-5">
            {/* Section title */}
            <div>
              <h2
                className="text-sm font-semibold text-zinc-800"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Content Input
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{
                  color: "#AAAAAA",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Paste a press release, brief, or report
              </p>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste press release or brief here...\n\nExample: "Reliance Industries expects revenue to grow 25% next year..."`}
                disabled={isFormDisabled}
                className="w-full h-48 px-3.5 py-3 rounded-xl text-sm leading-relaxed resize-none transition-all duration-150"
                style={{
                  background: "#FAFAF8",
                  border: "1px solid #E5E5E5",
                  color: "#2A2A2A",
                  fontFamily: "var(--font-dm-sans)",
                  outline: "none",
                  opacity: isFormDisabled ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#E8820C";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(232,130,12,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E5E5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <button
                  onClick={() => setContent(DEMO_CONTENT)}
                  disabled={isFormDisabled}
                  className="text-[11px] transition-colors disabled:opacity-40"
                  style={{
                    color: "#E8820C",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  Load demo content →
                </button>
                <span
                  className="text-[11px]"
                  style={{
                    color: "#C0C0C8",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {/* Content type */}
            <div>
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{
                  color: "#9A9AA5",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                Content Type
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {CONTENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setContentType(value)}
                    disabled={isFormDisabled}
                    className="py-2 rounded-lg text-xs font-medium border transition-all duration-150 disabled:opacity-50"
                    style={{
                      background:
                        contentType === value ? "#1A1A1A" : "#FFFFFF",
                      color: contentType === value ? "#FFFFFF" : "#6B6B75",
                      borderColor:
                        contentType === value ? "#1A1A1A" : "#E5E5E5",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Word count slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{
                    color: "#9A9AA5",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  Word Count
                </p>
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: "#E8820C",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {wordCount} words
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={800}
                step={50}
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                disabled={isFormDisabled}
                className="w-full h-1.5 rounded-full appearance-none"
                style={{
                  background: `linear-gradient(to right, #E8820C ${((wordCount - 200) / 600) * 100}%, #E5E5E5 ${((wordCount - 200) / 600) * 100}%)`,
                  opacity: isFormDisabled ? 0.5 : 1,
                }}
              />
              <div
                className="flex justify-between text-[10px] mt-1"
                style={{
                  color: "#D0D0D0",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                <span>200</span>
                <span>500</span>
                <span>800</span>
              </div>
            </div>

            {/* Language checkboxes */}
            <div>
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{
                  color: "#9A9AA5",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                Localize To
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.map(({ value, label, native }) => {
                  const isChecked = selectedLanguages.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleLanguage(value)}
                      disabled={isFormDisabled}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all duration-150 disabled:opacity-50"
                      style={{
                        background: isChecked
                          ? "rgba(232,130,12,0.05)"
                          : "#FFFFFF",
                        borderColor: isChecked ? "#E8820C" : "#E5E5E5",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      {/* Custom checkbox */}
                      <span
                        className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isChecked ? "#E8820C" : "transparent",
                          border: isChecked
                            ? "1.5px solid #E8820C"
                            : "1.5px solid #D0D0D0",
                        }}
                      >
                        {isChecked && (
                          <svg
                            width="8"
                            height="6"
                            viewBox="0 0 8 6"
                            fill="none"
                          >
                            <path
                              d="M1 3L3 5L7 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        style={{
                          color: isChecked ? "#1A1A1A" : "#8A8A95",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className="ml-auto"
                        style={{ color: "#C0C0C8" }}
                      >
                        {native}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Channel checkboxes */}
            <div>
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{
                  color: "#9A9AA5",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                Publish Channels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map(({ value, label }) => {
                  const isChecked = selectedChannels.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleChannel(value)}
                      disabled={isFormDisabled}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-150 disabled:opacity-50"
                      style={{
                        background: isChecked ? "#1A1A1A" : "#FFFFFF",
                        color: isChecked ? "#FFFFFF" : "#8A8A95",
                        borderColor: isChecked ? "#1A1A1A" : "#E5E5E5",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleSubmit}
              disabled={
                !content.trim() ||
                isSubmitting ||
                (phase !== "idle" && phase !== "failed")
              }
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#E8820C",
                fontFamily: "var(--font-dm-sans)",
                boxShadow: "0 1px 4px rgba(232,130,12,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = "#D4730A";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E8820C";
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Starting Pipeline...
                </>
              ) : (
                <>
                  <Play size={14} className="ml-0.5" />
                  Run Pipeline
                </>
              )}
            </button>

            {/* Reset link */}
            {(phase === "complete" || phase === "failed") && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 text-xs transition-colors"
                style={{
                  color: "#BEBEC8",
                  fontFamily: "var(--font-dm-mono)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#6B6B75")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#BEBEC8")
                }
              >
                <RotateCcw size={11} />
                Start new article
              </button>
            )}
          </div>
        </div>

        {/* ── Right panel: Pipeline output ─────────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "#F7F6F3" }}
        >
          <div className="p-6 max-w-2xl mx-auto">{renderRightPanel()}</div>
        </div>
      </div>
    </div>
  );
}
