import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react";
import type { ComplianceFlag, RiskLevel } from "@/lib/types";

interface CompliancePanelProps {
  flags: ComplianceFlag[];
  status: "PASS" | "FLAG";
  overallRisk: RiskLevel;
}

const SEVERITY = {
  high: {
    leftBorder: "#DC2626",
    badgeBg: "rgba(220,38,38,0.1)",
    badgeText: "#DC2626",
    quoteBg: "rgba(220,38,38,0.05)",
    quoteBorder: "rgba(220,38,38,0.12)",
    icon: AlertCircle,
    label: "HIGH",
  },
  medium: {
    leftBorder: "#D97706",
    badgeBg: "rgba(217,119,6,0.1)",
    badgeText: "#B45309",
    quoteBg: "rgba(217,119,6,0.05)",
    quoteBorder: "rgba(217,119,6,0.12)",
    icon: AlertTriangle,
    label: "MED",
  },
  low: {
    leftBorder: "#2563EB",
    badgeBg: "rgba(37,99,235,0.1)",
    badgeText: "#1D4ED8",
    quoteBg: "rgba(37,99,235,0.05)",
    quoteBorder: "rgba(37,99,235,0.12)",
    icon: Info,
    label: "LOW",
  },
};

export default function CompliancePanel({
  flags,
  status,
  overallRisk,
}: CompliancePanelProps) {
  if (status === "PASS") {
    return (
      <div className="animate-fade-up">
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{
            background: "rgba(5,150,105,0.06)",
            border: "1px solid rgba(5,150,105,0.2)",
          }}
        >
          <ShieldCheck size={22} style={{ color: "#059669" }} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm" style={{ color: "#065F46" }}>
              Compliance Passed
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6EE7B7" }}>
              No SEBI, brand, or legal violations detected
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={17} style={{ color: "#DC2626" }} />
          <h3
            className="text-base font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Compliance Review
          </h3>
        </div>

        {/* Overall risk badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
          style={{
            background:
              overallRisk === "high"
                ? "rgba(220,38,38,0.1)"
                : overallRisk === "medium"
                  ? "rgba(217,119,6,0.1)"
                  : "rgba(37,99,235,0.1)",
            color:
              overallRisk === "high"
                ? "#DC2626"
                : overallRisk === "medium"
                  ? "#B45309"
                  : "#1D4ED8",
            fontFamily: "var(--font-dm-mono)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background:
                overallRisk === "high"
                  ? "#DC2626"
                  : overallRisk === "medium"
                    ? "#D97706"
                    : "#2563EB",
            }}
          />
          {overallRisk.toUpperCase()} RISK · {flags.length} FLAG
          {flags.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* Flags list */}
      <div className="space-y-3">
        {flags.map((flag, i) => {
          const sev = SEVERITY[flag.severity];
          const SevIcon = sev.icon;

          return (
            <div
              key={`${flag.rule_id}-${i}`}
              className="rounded-xl overflow-hidden shadow-sm animate-flag-enter"
              style={{
                borderLeft: `4px solid ${sev.leftBorder}`,
                background: "#FFFFFF",
                border: "1px solid #EFEFEF",
                borderLeftWidth: "4px",
                borderLeftColor: sev.leftBorder,
                animationDelay: `${i * 90}ms`,
              }}
            >
              {/* Flag header row */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid #F5F5F5" }}
              >
                <SevIcon size={13} style={{ color: sev.leftBorder }} />
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: sev.badgeBg,
                    color: sev.badgeText,
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {flag.rule_id}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: sev.badgeText, fontFamily: "var(--font-dm-mono)" }}
                >
                  {sev.label}
                </span>
                <span className="flex-1" />
                <span
                  className="text-[10px]"
                  style={{ color: "#C0C0C8", fontFamily: "var(--font-dm-mono)" }}
                >
                  violation detected
                </span>
              </div>

              {/* Flag body */}
              <div className="px-4 py-4 space-y-3">
                {/* Rule description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#3A3A45", fontFamily: "var(--font-dm-sans)" }}
                >
                  {flag.rule_description}
                </p>

                {/* Quoted violation — the money shot */}
                <div
                  className="px-3 py-2.5 rounded-lg"
                  style={{
                    background: sev.quoteBg,
                    border: `1px solid ${sev.quoteBorder}`,
                  }}
                >
                  <p
                    className="text-[10px] mb-1.5 uppercase tracking-widest"
                    style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
                  >
                    Flagged text
                  </p>
                  <p
                    className="text-sm italic leading-relaxed"
                    style={{
                      color: "#2A2A2A",
                      fontFamily: "var(--font-playfair)",
                    }}
                  >
                    &ldquo;{flag.quote}&rdquo;
                  </p>
                </div>

                {/* Suggested fix — green, high contrast */}
                <div
                  className="px-3 py-2.5 rounded-lg"
                  style={{
                    background: "rgba(5,150,105,0.05)",
                    border: "1px solid rgba(5,150,105,0.15)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={11} style={{ color: "#059669" }} />
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: "#059669", fontFamily: "var(--font-dm-mono)" }}
                    >
                      Suggested Fix
                    </p>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#065F46", fontFamily: "var(--font-dm-sans)" }}
                  >
                    {flag.suggested_fix}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
