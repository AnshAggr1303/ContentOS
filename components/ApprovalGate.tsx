"use client";

import * as React from "react";
import { useState } from "react";
import { CheckCircle, XCircle, ChevronRight, Edit3 } from "lucide-react";

interface ApprovalGateProps {
  jobId: string;
  draft: string;
  headlines: string[];
  onApproved: () => void;
  onRejected: () => void;
}

export default function ApprovalGate({
  jobId,
  draft,
  headlines,
  onApproved,
  onRejected,
}: ApprovalGateProps) {
  const [selectedHeadline, setSelectedHeadline] = useState<string>(
    headlines[0] ?? ""
  );
  const [editedDraft, setEditedDraft] = useState(draft);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const wordCount = editedDraft.split(/\s+/).filter(Boolean).length;

  const handleApprove = async () => {
    if (!selectedHeadline) return;
    setIsApproving(true);
    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          gate: 1,
          approved: true,
          selectedHeadline,
          editedDraft,
        }),
      });
      onApproved();
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, gate: 1, approved: false }),
      });
      onRejected();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* Gate header */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(232,130,12,0.06)", border: "1px solid rgba(232,130,12,0.15)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "#E8820C", fontFamily: "var(--font-dm-mono)" }}
        >
          1
        </div>
        <div>
          <h3
            className="text-base font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Editorial Review — Gate 1
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Select a headline and review the draft before compliance check
          </p>
        </div>
      </div>

      {/* Headline selection */}
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-3"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Choose Headline
        </p>
        <div className="space-y-2">
          {headlines.map((headline, i) => {
            const isSelected = selectedHeadline === headline;
            return (
              <button
                key={i}
                onClick={() => setSelectedHeadline(headline)}
                className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 flex items-start gap-3 group"
                style={{
                  borderColor: isSelected ? "#E8820C" : "#EBEBEB",
                  background: isSelected ? "rgba(232,130,12,0.04)" : "#FFFFFF",
                }}
              >
                {/* Radio circle */}
                <span
                  className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    borderColor: isSelected ? "#E8820C" : "#D0D0D0",
                    background: isSelected ? "#E8820C" : "transparent",
                  }}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                  )}
                </span>

                <span
                  className="text-sm leading-snug flex-1"
                  style={{
                    fontFamily: "var(--font-playfair)",
                    color: isSelected ? "#1A1A1A" : "#5A5A65",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {headline}
                </span>

                {isSelected && (
                  <ChevronRight
                    size={14}
                    className="shrink-0 mt-0.5"
                    style={{ color: "#E8820C" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
          >
            Draft Article
          </p>
          <div className="flex items-center gap-1.5">
            <Edit3 size={10} style={{ color: "#BEBEC8" }} />
            <span
              className="text-[10px]"
              style={{ color: "#BEBEC8", fontFamily: "var(--font-dm-mono)" }}
            >
              editable
            </span>
          </div>
        </div>
        <textarea
          value={editedDraft}
          onChange={(e) => setEditedDraft(e.target.value)}
          className="w-full h-60 px-4 py-3.5 rounded-xl text-sm leading-relaxed resize-none transition-all duration-150"
          style={{
            background: "#FAFAF8",
            border: "1px solid #E5E5E5",
            color: "#2A2A2A",
            fontFamily: "var(--font-dm-sans)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#E8820C";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,130,12,0.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E5E5E5";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <p
          className="text-[11px] mt-1.5 text-right"
          style={{ color: "#C0C0C8", fontFamily: "var(--font-dm-mono)" }}
        >
          {wordCount} words
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={!selectedHeadline || isApproving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "#E8820C",
            fontFamily: "var(--font-dm-sans)",
          }}
          onMouseEnter={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.background = "#D4730A")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#E8820C")
          }
        >
          <CheckCircle size={14} />
          {isApproving ? "Approving..." : "Approve & Continue"}
        </button>

        <button
          onClick={handleReject}
          disabled={isRejecting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 disabled:opacity-50"
          style={{
            borderColor: "#E5E5E5",
            color: "#8A8A95",
            background: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#FCA5A5";
            e.currentTarget.style.color = "#DC2626";
            e.currentTarget.style.background = "#FFF5F5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E5E5E5";
            e.currentTarget.style.color = "#8A8A95";
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <XCircle size={14} />
          {isRejecting ? "Rejecting..." : "Reject"}
        </button>

        <span
          className="text-[11px] ml-auto"
          style={{ color: "#BEBEC8", fontFamily: "var(--font-dm-mono)" }}
        >
          pipeline paused at gate 1
        </span>
      </div>
    </div>
  );
}
