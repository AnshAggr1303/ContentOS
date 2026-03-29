"use client";

import * as React from "react";
import { useState } from "react";

interface ApprovalGateProps {
  jobId: string;
  draft: string;
  headlines: string[];
  onApproved: (selectedHeadline: string, editedDraft: string) => void;
  onRejected: () => void;
}

const HEADLINE_LABELS = ["PUNCHY", "DESCRIPTIVE", "ANALYTICAL"];

export default function ApprovalGate({
  jobId,
  draft,
  headlines,
  onApproved,
  onRejected,
}: ApprovalGateProps) {
  const [selectedHeadline, setSelectedHeadline] = useState<string>(headlines[0] ?? "");
  const [editedDraft, setEditedDraft] = useState(draft);
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

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
      onApproved(selectedHeadline, editedDraft);
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

  const draftParagraphs = editedDraft
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => p.trim());

  return (
    <div className="max-w-[1000px] mx-auto px-10 pt-12 pb-32">
      {/* Gate Header */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container" />
          <span className="text-[10px] font-label font-bold tracking-widest text-primary-container uppercase">
            GATE 1 OF 2 — DRAFT REVIEW
          </span>
        </div>
        <div className="flex justify-between items-end">
          <h2 className="text-[3.5rem] font-headline text-on-surface leading-tight">
            Editorial Draft Review
          </h2>
          <div className="flex gap-2 pb-4">
            <div className="px-4 py-1.5 bg-[#1A1A1A] text-white rounded-full text-xs font-label">
              Gate 1
            </div>
            <div className="px-4 py-1.5 border border-outline-variant text-slate-400 rounded-full text-xs font-label">
              Gate 2
            </div>
          </div>
        </div>
      </div>

      {/* Headline Selection */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-label font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            Select Headline
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {headlines.map((headline, i) => {
            const isSelected = selectedHeadline === headline;
            return (
              <div
                key={i}
                onClick={() => setSelectedHeadline(headline)}
                className={`p-6 rounded-xl cursor-pointer transition-all group ${
                  isSelected
                    ? "bg-white border-[1.5px] border-primary-container ring-4 ring-primary-container/5"
                    : "bg-white border border-outline-variant hover:border-primary-container"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`text-[10px] font-technical tracking-widest ${
                      isSelected ? "text-primary-container" : "text-slate-400 group-hover:text-primary-container"
                    }`}
                  >
                    {HEADLINE_LABELS[i] ?? `Option ${i + 1}`}
                  </span>
                  {isSelected && (
                    <span
                      className="material-symbols-outlined text-primary-container"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
                <p
                  className={`text-xl font-headline leading-snug ${
                    isSelected ? "text-on-surface" : "text-slate-600 group-hover:text-on-surface"
                  }`}
                >
                  {headline}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Article Draft */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-label font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            Article Draft
          </h3>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-xs font-label hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {isEditing ? "visibility" : "edit"}
            </span>
            <span>{isEditing ? "Preview" : "Edit Draft"}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="w-full h-80 font-body text-[17px] leading-[1.8] text-on-surface resize-none outline-none border border-outline-variant/20 rounded-lg p-6 focus:border-primary-container transition-colors"
            />
            <p className="text-[11px] mt-2 text-right text-outline font-label">
              {editedDraft.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        ) : (
          <article className="bg-white p-12 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-technical text-slate-400 tracking-widest">
                STORY SLUG
              </span>
              <span className="text-[10px] font-technical text-primary-container font-bold tracking-widest">
                {jobId.slice(0, 16).toUpperCase()}
              </span>
            </div>
            <h1 className="text-4xl font-headline leading-tight italic mb-10 text-on-surface">
              {selectedHeadline || headlines[0]}
            </h1>
            <div className="space-y-8 max-w-[720px]">
              {draftParagraphs.slice(0, 2).map((para, i) => (
                <p key={i} className="text-[17px] font-headline leading-[1.8] text-on-surface">
                  {para}
                </p>
              ))}
              {draftParagraphs.length > 2 && (
                <div className="relative pt-8 pb-4">
                  <div className="absolute inset-x-0 bottom-0 h-32 article-fade pointer-events-none" />
                  <p className="text-[17px] font-headline leading-[1.8] text-on-surface opacity-40">
                    {draftParagraphs[2]}
                  </p>
                </div>
              )}
            </div>
          </article>
        )}
      </section>

      {/* Sticky Action Footer */}
      <footer className="fixed bottom-0 left-64 right-0 h-20 bg-white border-t border-[#F3F4F6] flex justify-end items-center px-10 gap-4 z-50">
        <button
          onClick={handleReject}
          disabled={isRejecting}
          className="px-8 py-3 text-error border border-error rounded-lg text-sm font-label font-semibold hover:bg-error/5 transition-all active:scale-95 disabled:opacity-50"
        >
          {isRejecting ? "Rejecting..." : "Reject Draft"}
        </button>
        <button
          onClick={handleApprove}
          disabled={!selectedHeadline || isApproving}
          className="bg-[#1A1A1A] text-white border-l-4 border-primary-container px-8 py-3 rounded-lg text-sm font-label font-semibold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          <span>{isApproving ? "Forwarding..." : "Approve & Forward"}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
}
