"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ScrollText, ChevronDown, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditRow {
  id: number;
  job_id: string;
  agent_name: string;
  model_used: string;
  timestamp: string;
  input_hash: string | null;
  output_summary: string | null;
  flags: string | null;
  decision: string | null;
  duration_ms: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseFlags(raw: string | null): number {
  if (!raw) return 0;
  try {
    const arr = JSON.parse(raw) as unknown[];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  drafter:    { bg: "rgba(37,99,235,0.08)",  text: "#2563EB", border: "rgba(37,99,235,0.2)"  },
  compliance: { bg: "rgba(232,130,12,0.08)", text: "#E8820C", border: "rgba(232,130,12,0.2)" },
  localizer:  { bg: "rgba(124,58,237,0.08)", text: "#7C3AED", border: "rgba(124,58,237,0.2)" },
  distributor:{ bg: "rgba(5,150,105,0.08)",  text: "#059669", border: "rgba(5,150,105,0.2)"  },
};

function agentStyle(name: string) {
  return AGENT_COLORS[name] ?? { bg: "rgba(100,100,110,0.08)", text: "#64646E", border: "rgba(100,100,110,0.2)" };
}

function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) return <span style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }} className="text-xs">—</span>;

  const upper = decision.toUpperCase();
  if (upper === "PASS") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
        style={{ background: "rgba(5,150,105,0.1)", color: "#059669", border: "1px solid rgba(5,150,105,0.2)", fontFamily: "var(--font-dm-mono)" }}>
        PASS
      </span>
    );
  }
  if (upper === "FLAG" || upper === "FLAGGED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
        style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", fontFamily: "var(--font-dm-mono)" }}>
        FLAG
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px]"
      style={{ background: "rgba(100,100,110,0.08)", color: "#6B6B75", border: "1px solid rgba(100,100,110,0.12)", fontFamily: "var(--font-dm-mono)" }}>
      {decision}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/audit", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AuditRow[];
      setRows(data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => void fetchData(), 10_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const toggleRow = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#F7F6F3" }}>
      {/* ── Header ── */}
      <div className="shrink-0 px-8 pt-7 pb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(232,130,12,0.1)", border: "1px solid rgba(232,130,12,0.15)" }}>
              <ScrollText size={16} style={{ color: "#E8820C" }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight"
                style={{ fontFamily: "var(--font-playfair)", color: "#1A1A1E" }}>
                Audit Log
              </h1>
              <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-dm-mono)", color: "#8A8A95" }}>
                Every agent decision recorded — immutable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Row count pill */}
            {!loading && (
              <span className="px-2.5 py-1 rounded-full text-[11px]"
                style={{ background: "rgba(232,130,12,0.08)", color: "#E8820C", border: "1px solid rgba(232,130,12,0.15)", fontFamily: "var(--font-dm-mono)" }}>
                {rows.length} {rows.length === 1 ? "entry" : "entries"}
              </span>
            )}
            {/* Last refreshed */}
            <span className="text-[11px]" style={{ fontFamily: "var(--font-dm-mono)", color: "#ABABB5" }}>
              Updated {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
            {/* Manual refresh */}
            <button
              onClick={() => void fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
              style={{ background: "rgba(0,0,0,0.04)", color: "#6B6B75", border: "1px solid rgba(0,0,0,0.07)", fontFamily: "var(--font-dm-sans)" }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={20} className="animate-spin" style={{ color: "#E8820C" }} />
            <p className="text-sm" style={{ fontFamily: "var(--font-dm-mono)", color: "#9A9AA5" }}>
              Loading audit entries…
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#DC2626", fontFamily: "var(--font-dm-sans)" }}>
                Failed to load audit log
              </p>
              <p className="text-xs mt-1" style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}>
                {error}
              </p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(232,130,12,0.06)", border: "1px solid rgba(232,130,12,0.1)" }}>
              <ScrollText size={24} style={{ color: "rgba(232,130,12,0.4)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#4B4B55", fontFamily: "var(--font-dm-sans)" }}>
                No pipeline runs yet
              </p>
              <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}>
                Run a pipeline from the dashboard to see audit entries here.
              </p>
            </div>
          </div>
        ) : (
          /* ── Table ── */
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {/* Table header */}
            <div className="grid items-center px-4 py-2.5"
              style={{
                gridTemplateColumns: "160px 100px 120px 1fr 90px 60px 90px 24px",
                background: "rgba(0,0,0,0.025)",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}>
              {["Timestamp", "Job ID", "Agent", "Model", "Decision", "Flags", "Duration", ""].map((h) => (
                <span key={h} className="text-[10px] uppercase tracking-widest"
                  style={{ color: "#8A8A95", fontFamily: "var(--font-dm-mono)" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {rows.map((row, idx) => {
              const flagCount = parseFlags(row.flags);
              const isExpanded = expandedId === row.id;
              const ac = agentStyle(row.agent_name);
              const isLast = idx === rows.length - 1;

              return (
                <div key={row.id}>
                  {/* Main row */}
                  <div
                    className="grid items-center px-4 py-3 cursor-pointer transition-colors duration-100"
                    style={{
                      gridTemplateColumns: "160px 100px 120px 1fr 90px 60px 90px 24px",
                      background: isExpanded ? "rgba(232,130,12,0.03)" : "white",
                      borderBottom: isLast && !isExpanded ? "none" : "1px solid rgba(0,0,0,0.04)",
                    }}
                    onClick={() => toggleRow(row.id)}
                  >
                    {/* Timestamp */}
                    <span className="text-xs" style={{ fontFamily: "var(--font-dm-mono)", color: "#6B6B75" }}>
                      {formatTimestamp(row.timestamp)}
                    </span>

                    {/* Job ID */}
                    <span className="text-xs font-medium" style={{ fontFamily: "var(--font-dm-mono)", color: "#3A3A42" }}>
                      {row.job_id.slice(0, 8)}
                    </span>

                    {/* Agent badge */}
                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}`, fontFamily: "var(--font-dm-mono)" }}>
                      {row.agent_name}
                    </span>

                    {/* Model */}
                    <span className="text-xs truncate pr-2" style={{ fontFamily: "var(--font-dm-mono)", color: "#8A8A95" }}>
                      {row.model_used}
                    </span>

                    {/* Decision */}
                    <DecisionBadge decision={row.decision} />

                    {/* Flags */}
                    <div>
                      {flagCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                          style={{ background: "#DC2626", color: "white", fontFamily: "var(--font-dm-mono)" }}>
                          {flagCount}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#CBCBD0", fontFamily: "var(--font-dm-mono)" }}>—</span>
                      )}
                    </div>

                    {/* Duration */}
                    <span className="text-xs" style={{ fontFamily: "var(--font-dm-mono)", color: "#8A8A95" }}>
                      {formatDuration(row.duration_ms)}
                    </span>

                    {/* Expand chevron */}
                    <div className="flex items-center justify-center">
                      {isExpanded
                        ? <ChevronDown size={14} style={{ color: "#E8820C" }} />
                        : <ChevronRight size={14} style={{ color: "#CBCBD0" }} />
                      }
                    </div>
                  </div>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <div className="px-4 py-4"
                      style={{ background: "rgba(232,130,12,0.025)", borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.04)" }}>
                      <p className="text-[10px] uppercase tracking-widest mb-2"
                        style={{ fontFamily: "var(--font-dm-mono)", color: "#ABABB5" }}>
                        Output Summary
                      </p>
                      <p className="text-xs leading-relaxed"
                        style={{ fontFamily: "var(--font-dm-mono)", color: "#4B4B55", whiteSpace: "pre-wrap" }}>
                        {row.output_summary ?? "No output summary recorded."}
                      </p>
                      {row.input_hash && (
                        <p className="text-[10px] mt-3" style={{ fontFamily: "var(--font-dm-mono)", color: "#ABABB5" }}>
                          Input hash: <span style={{ color: "#6B6B75" }}>{row.input_hash}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
