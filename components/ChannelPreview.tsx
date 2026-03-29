"use client";

import * as React from "react";
import { useState } from "react";
import type {
  Channel,
  Language,
  ChannelOutputMap,
  EtWebOutput,
  EtAppOutput,
  WhatsAppOutput,
  LinkedInOutput,
  NewsletterOutput,
} from "@/lib/types";

interface ChannelPreviewProps {
  jobId: string;
  channels: Partial<ChannelOutputMap>;
  localizations: Record<Language, string>;
  onPublished: () => void;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: string }> = {
  et_web: { label: "ET Web", icon: "web" },
  et_app: { label: "ET App", icon: "smartphone" },
  whatsapp: { label: "WhatsApp", icon: "chat" },
  linkedin: { label: "LinkedIn", icon: "share" },
  newsletter: { label: "Newsletter", icon: "mail" },
};

const LANGUAGE_CONFIG: Record<Language, { label: string; code: string }> = {
  hi: { label: "Hindi", code: "HI" },
  ta: { label: "Tamil", code: "TA" },
  te: { label: "Telugu", code: "TE" },
  bn: { label: "Bengali", code: "BN" },
};

// ── Channel content renderers ──────────────────────

function EtWebPreview({ data }: { data: EtWebOutput }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-outline-variant/10">
      <div className="bg-surface-container-high px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 max-w-md mx-auto bg-white rounded h-5 text-[10px] flex items-center px-2 text-slate-400 font-label">
          economictimes.indiatimes.com/news
        </div>
      </div>
      <div className="p-8">
        <h1 className="font-headline text-3xl italic text-on-surface leading-tight mb-4">
          {data.headline}
        </h1>
        <p className="font-body text-base text-on-surface leading-relaxed mb-6 line-clamp-4">
          {data.body}
        </p>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-surface-container text-on-surface-variant font-label text-[10px] uppercase tracking-wider rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EtAppPreview({ data }: { data: EtAppOutput }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-[#1A1A1A]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center">
            <span className="text-white text-[8px] font-bold font-label">ET</span>
          </div>
          <span className="text-[10px] text-slate-400 font-label uppercase tracking-wider">
            Push Notification
          </span>
        </div>
        <p className="text-sm font-medium text-white leading-snug">{data.push_title}</p>
      </div>
      <div className="bg-white rounded-xl p-6 border border-outline-variant/10">
        <p className="text-[10px] uppercase tracking-widest mb-2 text-outline font-label">
          Card Preview
        </p>
        <p className="font-body text-base text-on-surface-variant leading-relaxed">
          {data.card_preview}
        </p>
      </div>
    </div>
  );
}

function WhatsAppPreview({ data }: { data: WhatsAppOutput }) {
  return (
    <div className="bg-[#ECE5DD] rounded-xl p-6">
      <div className="flex justify-end">
        <div className="bg-[#DCF8C6] rounded-xl rounded-tr-none p-4 max-w-[85%] shadow-sm">
          <p className="font-label text-sm leading-relaxed whitespace-pre-wrap text-[#1A1A1A]">
            {data.text}
          </p>
          <p className="text-[10px] text-slate-400 text-right mt-1">✓✓</p>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ data }: { data: LinkedInOutput }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-outline-variant/10 space-y-4">
      <div className="border-b border-outline-variant/20 pb-4">
        <p className="text-[10px] uppercase tracking-widest mb-1.5 text-outline font-label">
          Hook
        </p>
        <p className="font-body text-lg font-semibold text-on-background leading-snug">
          {data.hook}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-1.5 text-outline font-label">
          Body
        </p>
        <p className="font-body text-base text-on-surface-variant leading-relaxed">{data.body}</p>
      </div>
      <div className="border-t border-outline-variant/20 pt-4">
        <p className="text-[10px] uppercase tracking-widest mb-1.5 text-outline font-label">CTA</p>
        <p className="font-body text-base font-medium text-primary-container">{data.cta}</p>
      </div>
    </div>
  );
}

function NewsletterPreview({ data }: { data: NewsletterOutput }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-lg bg-surface-container border border-outline-variant/20">
        <p className="text-[10px] uppercase tracking-widest mb-1.5 text-outline font-label">
          Subject Line
        </p>
        <p className="font-body text-lg font-semibold text-on-background">{data.subject}</p>
      </div>
      <div className="bg-white rounded-xl p-6 border border-outline-variant/10">
        <p className="text-[10px] uppercase tracking-widest mb-1.5 text-outline font-label">
          Preview Text
        </p>
        <p className="font-body text-base italic text-on-surface-variant leading-relaxed">
          {data.preview_text}
        </p>
      </div>
    </div>
  );
}

function renderChannelContent(ch: Channel, channels: Partial<ChannelOutputMap>) {
  const data = channels[ch];
  if (!data) return <p className="text-sm text-outline">No content for this channel.</p>;
  switch (ch) {
    case "et_web":
      return <EtWebPreview data={data as EtWebOutput} />;
    case "et_app":
      return <EtAppPreview data={data as EtAppOutput} />;
    case "whatsapp":
      return <WhatsAppPreview data={data as WhatsAppOutput} />;
    case "linkedin":
      return <LinkedInPreview data={data as LinkedInOutput} />;
    case "newsletter":
      return <NewsletterPreview data={data as NewsletterOutput} />;
    default:
      return null;
  }
}

// ── Main component ──────────────────────────────────

export default function ChannelPreview({
  jobId,
  channels,
  localizations,
  onPublished,
}: ChannelPreviewProps) {
  const availableChannels = Object.keys(channels) as Channel[];
  const [activeChannel, setActiveChannel] = useState<Channel>(
    availableChannels[0] ?? "et_web"
  );
  const [selectedChannels, setSelectedChannels] = useState<Set<Channel>>(
    new Set(availableChannels)
  );
  const [expandedLang, setExpandedLang] = useState<Language | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const availableLangs = Object.keys(localizations) as Language[];

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedChannels.size === 0) return;
    setIsPublishing(true);
    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          gate: 2,
          approved: true,
          selectedChannels: Array.from(selectedChannels),
        }),
      });
      onPublished();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-10 pt-10 pb-32 w-full">
      {/* Gate Header */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-label text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
            GATE 2 OF 2 — FINAL REVIEW
          </span>
        </div>
        <div className="flex justify-between items-end">
          <h2 className="font-headline text-[36px] text-on-surface leading-tight">
            Channel Distribution Review
          </h2>
          <div className="flex gap-2">
            <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2 text-emerald-700 text-xs font-label font-semibold">
              <span>Gate 1</span>
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div className="px-4 py-1.5 bg-[#1A1A1A] text-white rounded-full text-xs font-label font-semibold">
              Gate 2
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex gap-10 items-start">
        {/* Left: Channel Toggles */}
        <aside className="w-[300px] flex flex-col gap-6 sticky top-24 shrink-0">
          <section>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-4 block">
              Publish To
            </label>
            <div className="flex flex-col gap-3">
              {availableChannels.map((ch) => {
                const cfg = CHANNEL_CONFIG[ch];
                const isSelected = selectedChannels.has(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isSelected
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">{cfg.icon}</span>
                      <span className="font-label font-medium text-sm">{cfg.label}</span>
                    </div>
                    {isSelected && (
                      <span
                        className="material-symbols-outlined text-primary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 font-technical text-[11px] text-slate-500 uppercase text-center">
              {selectedChannels.size} of {availableChannels.length} channels selected
            </p>
          </section>

          {/* Publish ETA */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/20">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">
              Publish ETA
            </span>
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-label font-bold text-2xl text-[#059669]">INSTANT</span>
              <span className="font-technical text-[10px] text-slate-400">SYNC: 100%</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary-container w-full" />
            </div>
          </div>
        </aside>

        {/* Right: Preview + Localizations */}
        <div className="flex-1 flex flex-col gap-10 min-w-0">
          {/* Channel Tab Bar */}
          <section>
            <div className="flex border-b border-outline-variant/20 mb-6 overflow-x-auto no-scrollbar">
              {availableChannels.map((ch) => {
                const cfg = CHANNEL_CONFIG[ch];
                return (
                  <button
                    key={ch}
                    onClick={() => setActiveChannel(ch)}
                    className={`px-6 py-3 font-label text-sm whitespace-nowrap transition-colors ${
                      activeChannel === ch
                        ? "border-b-2 border-primary-container text-on-surface font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            {renderChannelContent(activeChannel, channels)}
          </section>

          {/* Regional Localizations */}
          {availableLangs.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-label text-[11px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap">
                  Regional Localizations — {availableLangs.length} Languages
                </h3>
                <div className="h-[1px] flex-1 bg-outline-variant/20" />
              </div>
              <div className="space-y-4">
                {availableLangs.map((lang) => {
                  const cfg = LANGUAGE_CONFIG[lang];
                  const isExpanded = expandedLang === lang;
                  const content = localizations[lang];
                  return (
                    <div key={lang}>
                      {isExpanded ? (
                        <div className="bg-white rounded-xl border-l-4 border-primary-container p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 font-technical text-xs font-bold rounded">
                                {cfg.code}
                              </div>
                              <div>
                                <p className="font-label text-sm font-bold text-on-surface">
                                  {cfg.label}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedLang(null)}
                              className="material-symbols-outlined text-on-surface-variant"
                            >
                              expand_less
                            </button>
                          </div>
                          <div className="pl-12">
                            <p className="font-headline text-base text-on-surface leading-relaxed border-l-2 border-surface-container pl-6 py-2 italic">
                              {content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedLang(lang)}
                          className="w-full bg-surface-container-low rounded-xl px-6 py-4 flex items-center justify-between hover:bg-surface-container transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 flex items-center justify-center bg-white border border-outline-variant/20 font-technical text-xs font-bold rounded">
                              {cfg.code}
                            </div>
                            <span className="font-label text-sm font-medium text-on-surface">
                              {cfg.label}
                            </span>
                            <span className="font-headline text-xs text-on-surface-variant ml-2 truncate max-w-[200px]">
                              {content?.slice(0, 60)}...
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                            expand_more
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-64 right-0 h-20 bg-white border-t border-[#F3F4F6] flex justify-between items-center px-10 z-50">
        <div />
        <div className="flex gap-4">
          <button
            onClick={handlePublish}
            disabled={selectedChannels.size === 0 || isPublishing}
            className="bg-primary-container text-white rounded-lg px-8 py-3 border-l-4 border-primary-container font-label font-bold flex items-center gap-3 shadow-lg shadow-primary-container/20 hover:bg-[#D6760B] transition-all active:scale-95 disabled:opacity-50"
          >
            {isPublishing
              ? "Publishing..."
              : `Publish to ${selectedChannels.size} Channel${selectedChannels.size !== 1 ? "s" : ""}`}
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
