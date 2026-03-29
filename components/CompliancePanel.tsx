"use client";

import * as React from "react";
import { useState } from "react";
import type { ComplianceResult, ComplianceFlag, RiskLevel } from "@/lib/types";

interface CompliancePanelProps {
  result: ComplianceResult;
  draft: string;
  onApplyFix: (quote: string, fix: string) => void;
  onContinue: () => void;
}

const SEVERITY_CONFIG: Record<
  RiskLevel,
  { border: string; badgeBg: string; badgeText: string; icon: string; label: string }
> = {
  high: {
    border: "border-[#DC2626]",
    badgeBg: "bg-red-50",
    badgeText: "text-[#DC2626]",
    icon: "report",
    label: "Critical Priority",
  },
  medium: {
    border: "border-[#D97706]",
    badgeBg: "bg-amber-50",
    badgeText: "text-[#D97706]",
    icon: "warning",
    label: "Medium Priority",
  },
  low: {
    border: "border-[#2563EB]",
    badgeBg: "bg-blue-50",
    badgeText: "text-[#2563EB]",
    icon: "info",
    label: "Low Priority",
  },
};

function deriveScore(flags: ComplianceFlag[]): number {
  const deduction =
    flags.filter((f) => f.severity === "high").length * 18 +
    flags.filter((f) => f.severity === "medium").length * 12 +
    flags.filter((f) => f.severity === "low").length * 6;
  return Math.max(10, 100 - deduction);
}

export default function CompliancePanel({
  result,
  draft,
  onApplyFix,
  onContinue,
}: CompliancePanelProps) {
  const [appliedFlags, setAppliedFlags] = useState<Set<number>>(new Set());

  const { flags, status, overall_risk } = result;
  const score = status === "PASS" ? 100 : deriveScore(flags);
  const highCount = flags.filter((f) => f.severity === "high").length;
  const flagCount = flags.length;

  const handleApply = (i: number, flag: ComplianceFlag) => {
    onApplyFix(flag.quote, flag.suggested_fix);
    setAppliedFlags((prev) => new Set([...prev, i]));
  };

  return (
    <div className="max-w-[1000px] mx-auto px-10 pt-12 pb-32 animate-fade-up">
      {/* Header */}
      <section className="space-y-4 mb-12">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary-container rounded-full" />
          <span className="text-[10px] font-bold text-primary-container uppercase tracking-[0.2em]">
            Compliance Analysis Complete
          </span>
        </div>
        <h2 className="text-[36px] font-headline font-bold text-[#1A1A1A]">
          Compliance Review Results
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          {/* Risk card */}
          <div className="bg-white rounded-xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Risk Assessment
              </p>
              <div
                className={`flex items-center gap-2 font-bold text-lg ${
                  status === "PASS"
                    ? "text-[#059669]"
                    : overall_risk === "high"
                    ? "text-[#DC2626]"
                    : overall_risk === "medium"
                    ? "text-[#D97706]"
                    : "text-[#2563EB]"
                }`}
              >
                <span>●</span>
                <span>
                  {status === "PASS"
                    ? "ALL CLEAR"
                    : `${overall_risk.toUpperCase()} RISK · ${flagCount} FLAG${flagCount !== 1 ? "S" : ""}`}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-200 text-4xl">gavel</span>
          </div>
          {/* Score card */}
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Compliance Score
              </p>
              <span className="text-2xl font-headline font-bold text-primary-container">
                {score}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PASS state */}
      {status === "PASS" && (
        <div className="bg-white rounded-xl p-10 text-center border border-outline-variant/10">
          <span
            className="material-symbols-outlined text-[#059669] text-5xl mb-4 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            task_alt
          </span>
          <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
            All Rules Passed
          </h3>
          <p className="text-sm font-label text-slate-500">
            No compliance violations detected. Article is ready for distribution.
          </p>
        </div>
      )}

      {/* Flag Cards */}
      {flags.length > 0 && (
        <section className="space-y-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
            Detected Violations
          </h3>

          {flags.map((flag, i) => {
            const cfg = SEVERITY_CONFIG[flag.severity];
            const isApplied = appliedFlags.has(i);

            return (
              <article
                key={`${flag.rule_id}-${i}`}
                className={`bg-white rounded-xl border-l-[6px] ${cfg.border} p-8 shadow-sm transition-transform hover:scale-[1.005] animate-flag-enter`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {/* Flag header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-technical ${cfg.badgeBg} ${cfg.badgeText} px-2 py-0.5 rounded`}
                      >
                        Rule: {flag.rule_id}
                      </span>
                      <span className={`text-xs font-bold ${cfg.badgeText} uppercase tracking-widest`}>
                        {cfg.label}
                      </span>
                    </div>
                    <h4 className="text-xl font-headline font-bold text-[#1A1A1A]">
                      {flag.rule_description}
                    </h4>
                  </div>
                  <span
                    className={`material-symbols-outlined ${cfg.badgeText}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {cfg.icon}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Flagged text */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">
                      Flagged Text Segment
                    </p>
                    <blockquote className="font-headline text-lg text-slate-700 leading-relaxed italic">
                      &ldquo;...
                      <span
                        className={`${
                          flag.severity === "high"
                            ? "bg-red-100 text-[#DC2626] border-b-2 border-[#DC2626]"
                            : flag.severity === "medium"
                            ? "bg-amber-100 text-[#D97706] border-b-2 border-[#D97706]"
                            : "bg-blue-100 text-[#2563EB] border-b-2 border-[#2563EB]"
                        } px-1`}
                      >
                        {flag.quote}
                      </span>
                      ...&rdquo;
                    </blockquote>
                  </div>

                  {/* Suggested fix */}
                  <div
                    className={`flex flex-col md:flex-row gap-4 items-center justify-between p-6 rounded-lg border ${
                      isApplied
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-emerald-50/50 border-emerald-100"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="material-symbols-outlined text-[#059669] mt-1"
                        style={isApplied ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {isApplied ? "check_circle" : "auto_fix"}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-[#059669] uppercase tracking-widest mb-1">
                          {isApplied ? "Applied Resolution" : "AI Suggested Fix"}
                        </p>
                        <p
                          className={`text-sm font-medium text-slate-800 ${
                            isApplied ? "line-through decoration-slate-400" : ""
                          }`}
                        >
                          {flag.suggested_fix}
                        </p>
                        {isApplied && (
                          <p className="text-xs font-bold text-[#059669] mt-1 italic font-technical">
                            Fix applied to draft
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => !isApplied && handleApply(i, flag)}
                      disabled={isApplied || !draft}
                      className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isApplied
                          ? "bg-[#059669] text-white cursor-default flex items-center gap-2"
                          : "bg-primary-container text-white hover:bg-[#D6760B] active:scale-95"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <span>✓</span>
                          <span>Applied</span>
                        </>
                      ) : (
                        "Apply Fix"
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Sticky Action Footer */}
      <footer className="fixed bottom-0 left-64 right-0 h-20 bg-white border-t border-[#F3F4F6] flex justify-between items-center px-10 z-50">
        <div className="flex-1 flex items-center">
          <div className="flex items-center gap-3 text-slate-500">
            {highCount > 0 && (
              <>
                <span className="material-symbols-outlined text-[#DC2626] text-sm">warning</span>
                <span className="text-sm font-label">
                  {highCount} high-risk flag{highCount !== 1 ? "s" : ""} detected
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="bg-[#1A1A1A] text-white border-l-4 border-primary-container px-8 py-3 rounded-lg flex items-center gap-3 font-semibold text-sm font-label hover:bg-black transition-all active:scale-95"
          >
            Continue to Distribution
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
