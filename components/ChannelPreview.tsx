"use client";

import * as React from "react";
import { useState } from "react";
import {
  CheckCircle,
  Globe,
  Smartphone,
  MessageCircle,
  Share2,
  Mail,
  ChevronDown,
} from "lucide-react";
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
  localizations: Partial<Record<Language, string>>;
  onApproved: () => void;
}

type LucideIconComponent = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: LucideIconComponent; color: string }> = {
  et_web: { label: "ET Web", icon: Globe, color: "#1A1A1A" },
  et_app: { label: "ET App", icon: Smartphone, color: "#7C3AED" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  linkedin: { label: "LinkedIn", icon: Share2, color: "#0077B5" },
  newsletter: { label: "Newsletter", icon: Mail, color: "#E8820C" },
};

const LANGUAGE_CONFIG: Record<Language, { label: string; native: string; script: string }> = {
  hi: { label: "Hindi", native: "हिन्दी", script: "Devanagari" },
  ta: { label: "Tamil", native: "தமிழ்", script: "Tamil" },
  te: { label: "Telugu", native: "తెలుగు", script: "Telugu" },
  bn: { label: "Bengali", native: "বাংলা", script: "Bengali" },
};

// ── Channel content renderers ──────────────────────

function EtWebPreview({ data }: { data: EtWebOutput }) {
  return (
    <div className="space-y-4">
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-1.5"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Headline
        </p>
        <h3
          className="text-xl font-semibold leading-snug text-zinc-900"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {data.headline}
        </h3>
      </div>
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-1.5"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Body
        </p>
        <p
          className="text-sm leading-relaxed text-zinc-600 line-clamp-6"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {data.body}
        </p>
      </div>
      {data.tags.length > 0 && (
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-1.5"
            style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
          >
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded"
                style={{
                  background: "#F4F4F6",
                  color: "#6B6B75",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EtAppPreview({ data }: { data: EtAppOutput }) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl"
        style={{ background: "#1A1A1A" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: "#E8820C" }}
          >
            <span className="text-white text-[8px] font-bold">ET</span>
          </div>
          <span
            className="text-[10px]"
            style={{ color: "#6B6B75", fontFamily: "var(--font-dm-mono)" }}
          >
            PUSH NOTIFICATION
          </span>
        </div>
        <p className="text-sm font-medium text-white leading-snug">
          {data.push_title}
        </p>
      </div>
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-1.5"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Card Preview
        </p>
        <p
          className="text-sm text-zinc-600 leading-relaxed"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {data.card_preview}
        </p>
      </div>
    </div>
  );
}

function WhatsAppPreview({ data }: { data: WhatsAppOutput }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: "#ECF8EC", border: "1px solid #D4EED4" }}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="w-2 h-2 rounded-full" style={{ background: "#25D366" }} />
        <span
          className="text-[10px] font-medium"
          style={{ color: "#25D366", fontFamily: "var(--font-dm-mono)" }}
        >
          WhatsApp Message
        </span>
      </div>
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: "#1A2E1A", fontFamily: "var(--font-dm-sans)" }}
      >
        {data.text}
      </p>
    </div>
  );
}

function LinkedInPreview({ data }: { data: LinkedInOutput }) {
  return (
    <div className="space-y-3">
      <div style={{ borderBottom: "1px solid #F0F0F0", paddingBottom: "12px" }}>
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Hook
        </p>
        <p className="text-sm font-semibold text-zinc-800">{data.hook}</p>
      </div>
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Body
        </p>
        <p
          className="text-sm text-zinc-600 leading-relaxed"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {data.body}
        </p>
      </div>
      <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: "12px" }}>
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          CTA
        </p>
        <p className="text-sm font-medium" style={{ color: "#0077B5" }}>
          {data.cta}
        </p>
      </div>
    </div>
  );
}

function NewsletterPreview({ data }: { data: NewsletterOutput }) {
  return (
    <div className="space-y-3">
      <div
        className="p-4 rounded-lg"
        style={{ background: "#F9F8F5", border: "1px solid #EBEBEB" }}
      >
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Subject Line
        </p>
        <p className="text-sm font-semibold text-zinc-800">{data.subject}</p>
      </div>
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Preview Text
        </p>
        <p
          className="text-sm italic text-zinc-500 leading-relaxed"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {data.preview_text}
        </p>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────

export default function ChannelPreview({
  jobId,
  channels,
  localizations,
  onApproved,
}: ChannelPreviewProps) {
  const availableChannels = Object.keys(channels) as Channel[];
  const [activeChannel, setActiveChannel] = useState<Channel>(
    availableChannels[0] ?? "et_web"
  );
  const [selectedChannels, setSelectedChannels] = useState<Set<Channel>>(
    new Set(availableChannels)
  );
  const [expandedLang, setExpandedLang] = useState<Language | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const availableLangs = Object.keys(localizations) as Language[];

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);
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
      onApproved();
    } finally {
      setIsApproving(false);
    }
  };

  const renderContent = (ch: Channel) => {
    const data = channels[ch];
    if (!data)
      return (
        <p className="text-sm text-zinc-400">No content for this channel.</p>
      );
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
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* Gate header */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(26,26,26,0.04)", border: "1px solid #E5E5E5" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "#1A1A1A", fontFamily: "var(--font-dm-mono)" }}
        >
          2
        </div>
        <div>
          <h3
            className="text-base font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Final Review — Gate 2
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review all channel formats and approve for publishing
          </p>
        </div>
      </div>

      {/* Channel tabs */}
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-3"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Channel Outputs
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {availableChannels.map((ch) => {
            const cfg = CHANNEL_CONFIG[ch];
            const Icon = cfg.icon;
            const isActive = activeChannel === ch;
            const isSelected = selectedChannels.has(ch);

            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: isActive ? "#1A1A1A" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#6B6B75",
                  border: isActive ? "1px solid #1A1A1A" : "1px solid #E5E5E5",
                  opacity: isSelected ? 1 : 0.4,
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <Icon size={12} style={{ color: isActive ? "#FFFFFF" : cfg.color }} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Channel content card */}
        <div
          className="rounded-xl p-5 min-h-[200px]"
          style={{ background: "#FFFFFF", border: "1px solid #EBEBEB" }}
        >
          {renderContent(activeChannel)}
        </div>
      </div>

      {/* Publish toggles */}
      <div>
        <p
          className="text-[10px] uppercase tracking-widest mb-3"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Publish To
        </p>
        <div className="flex flex-wrap gap-2">
          {availableChannels.map((ch) => {
            const cfg = CHANNEL_CONFIG[ch];
            const Icon = cfg.icon;
            const isSelected = selectedChannels.has(ch);

            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150"
                style={{
                  background: isSelected ? cfg.color : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#8A8A95",
                  borderColor: isSelected ? cfg.color : "#E5E5E5",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <Icon size={11} />
                {cfg.label}
                {isSelected && (
                  <CheckCircle size={10} className="ml-0.5 opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Localizations */}
      {availableLangs.length > 0 && (
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-3"
            style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
          >
            Localizations — {availableLangs.length} Languages
          </p>
          <div className="space-y-2">
            {availableLangs.map((lang) => {
              const cfg = LANGUAGE_CONFIG[lang];
              const isExpanded = expandedLang === lang;
              const content = localizations[lang];

              return (
                <div
                  key={lang}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #EBEBEB", background: "#FFFFFF" }}
                >
                  <button
                    onClick={() => setExpandedLang(isExpanded ? null : lang)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-sm font-medium text-zinc-800"
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm" style={{ color: "#AAAAAA" }}>
                        {cfg.native}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "#F4F4F6",
                          color: "#9A9AA5",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {cfg.script}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{
                        color: "#BEBEC8",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                  {isExpanded && content && (
                    <div
                      className="px-4 pb-4"
                      style={{ borderTop: "1px solid #F5F5F5" }}
                    >
                      <p
                        className="text-sm leading-relaxed mt-3"
                        style={{ color: "#3A3A45", fontFamily: "var(--font-dm-sans)" }}
                      >
                        {content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approve action */}
      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: "1px solid #EBEBEB" }}
      >
        <button
          onClick={handleApprove}
          disabled={selectedChannels.size === 0 || isApproving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "#1A1A1A",
            fontFamily: "var(--font-dm-sans)",
          }}
          onMouseEnter={(e) =>
            !e.currentTarget.disabled &&
            (e.currentTarget.style.background = "#E8820C")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#1A1A1A")
          }
        >
          <CheckCircle size={14} />
          {isApproving
            ? "Publishing..."
            : `Publish to ${selectedChannels.size} Channel${selectedChannels.size !== 1 ? "s" : ""}`}
        </button>
        <p
          className="text-[11px]"
          style={{ color: "#BEBEC8", fontFamily: "var(--font-dm-mono)" }}
        >
          {selectedChannels.size} of {availableChannels.length} channels selected
        </p>
      </div>
    </div>
  );
}
