"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Edit2, X, Check, RefreshCw, AlertTriangle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Rule {
  id: string;
  category: string;
  description: string;
  pattern_hint: string;
  severity: "low" | "medium" | "high";
  suggested_rewrite_hint: string;
}

interface RulesData {
  sebi: Rule[];
  brand: Rule[];
  legal: Rule[];
}

type RulesetKey = "sebi" | "brand" | "legal";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { key: RulesetKey; label: string; color: string }[] = [
  { key: "sebi",  label: "SEBI Rules",  color: "#2563EB" },
  { key: "brand", label: "Brand Voice", color: "#E8820C" },
  { key: "legal", label: "Legal",       color: "#7C3AED" },
];

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: "rgba(220,38,38,0.08)",  text: "#DC2626", border: "rgba(220,38,38,0.2)"  },
  medium: { bg: "rgba(217,119,6,0.08)",  text: "#D97706", border: "rgba(217,119,6,0.2)"  },
  low:    { bg: "rgba(37,99,235,0.08)",  text: "#2563EB", border: "rgba(37,99,235,0.2)"  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.04em" }}>
      {severity}
    </span>
  );
}

interface RuleCardProps {
  rule: Rule;
  onSave: (updated: Rule) => Promise<void>;
}

function RuleCard({ rule, onSave }: RuleCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Rule>(rule);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleEdit = () => {
    setDraft(rule);
    setSaveError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(rule);
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    fontFamily: "var(--font-dm-mono)",
    fontSize: "12px",
    color: "#3A3A42",
    background: "rgba(0,0,0,0.025)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "6px",
    padding: "6px 10px",
    width: "100%",
    outline: "none",
  } as const;

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-150"
      style={{ background: "white", border: editing ? "1px solid rgba(232,130,12,0.3)" : "1px solid rgba(0,0,0,0.07)" }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: editing ? "rgba(232,130,12,0.02)" : "transparent" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold"
            style={{ fontFamily: "var(--font-dm-mono)", color: "#1A1A1E", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "4px" }}>
            {rule.id}
          </span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}>
            {rule.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={editing ? draft.severity : rule.severity} />
          {!editing ? (
            <button onClick={handleEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all duration-150"
              style={{ background: "rgba(0,0,0,0.03)", color: "#6B6B75", border: "1px solid rgba(0,0,0,0.07)", fontFamily: "var(--font-dm-sans)" }}>
              <Edit2 size={10} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={handleCancel}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-all duration-150"
                style={{ background: "rgba(0,0,0,0.03)", color: "#6B6B75", border: "1px solid rgba(0,0,0,0.07)", fontFamily: "var(--font-dm-sans)" }}>
                <X size={10} />
                Cancel
              </button>
              <button onClick={() => void handleSave()} disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-all duration-150"
                style={{ background: saving ? "rgba(232,130,12,0.6)" : "#E8820C", color: "white", border: "none", fontFamily: "var(--font-dm-sans)", cursor: saving ? "wait" : "pointer" }}>
                {saving ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-3">
        {saveError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626", fontFamily: "var(--font-dm-mono)" }}>
            <AlertTriangle size={12} />
            {saveError}
          </div>
        )}

        {/* Description */}
        <div>
          <Label>Description</Label>
          {editing ? (
            <input type="text" value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              style={fieldStyle} />
          ) : (
            <p className="text-sm leading-snug" style={{ fontFamily: "var(--font-dm-sans)", color: "#2A2A32" }}>
              {rule.description}
            </p>
          )}
        </div>

        {/* Pattern hint */}
        <div>
          <Label>Pattern Hint</Label>
          {editing ? (
            <input type="text" value={draft.pattern_hint}
              onChange={(e) => setDraft({ ...draft, pattern_hint: e.target.value })}
              style={fieldStyle} />
          ) : (
            <p className="text-xs leading-relaxed break-all"
              style={{ fontFamily: "var(--font-dm-mono)", color: "#6B6B75", background: "rgba(0,0,0,0.025)", padding: "6px 10px", borderRadius: "6px" }}>
              {rule.pattern_hint}
            </p>
          )}
        </div>

        {/* Severity (edit mode only — badge shown in header) */}
        {editing && (
          <div>
            <Label>Severity</Label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((s) => {
                const sv = SEVERITY_STYLES[s];
                const active = draft.severity === s;
                return (
                  <button key={s} onClick={() => setDraft({ ...draft, severity: s })}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium uppercase transition-all duration-100"
                    style={{
                      background: active ? sv.bg : "transparent",
                      color: active ? sv.text : "#9A9AA5",
                      border: active ? `1px solid ${sv.border}` : "1px solid rgba(0,0,0,0.08)",
                      fontFamily: "var(--font-dm-mono)",
                      letterSpacing: "0.04em",
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested rewrite hint */}
        <div>
          <Label>Suggested Rewrite</Label>
          {editing ? (
            <textarea value={draft.suggested_rewrite_hint} rows={3}
              onChange={(e) => setDraft({ ...draft, suggested_rewrite_hint: e.target.value })}
              style={{ ...fieldStyle, resize: "vertical" as const }} />
          ) : (
            <p className="text-xs leading-relaxed"
              style={{ fontFamily: "var(--font-dm-mono)", color: "#4B4B55", background: "rgba(5,150,105,0.04)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(5,150,105,0.12)" }}>
              {rule.suggested_rewrite_hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest mb-1.5"
      style={{ fontFamily: "var(--font-dm-mono)", color: "#ABABB5" }}>
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RulesEditorPage() {
  const [data, setData] = useState<RulesData | null>(null);
  const [activeTab, setActiveTab] = useState<RulesetKey>("sebi");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rules", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as RulesData;
      setData(json);
      setFetchError(null);
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const handleSaveRule = async (rulesetKey: RulesetKey, updated: Rule) => {
    if (!data) return;
    const updatedRuleset = data[rulesetKey].map((r) =>
      r.id === updated.id ? updated : r,
    );

    const res = await fetch("/api/admin/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: rulesetKey, rules: updatedRuleset }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    // Update local state on success
    setData({ ...data, [rulesetKey]: updatedRuleset });
  };

  const activeTabDef = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#F7F6F3" }}>
      {/* ── Header ── */}
      <div className="shrink-0 px-8 pt-7 pb-0 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <Settings size={16} style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight"
                style={{ fontFamily: "var(--font-playfair)", color: "#1A1A1E" }}>
                Rules Editor
              </h1>
              <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-dm-mono)", color: "#8A8A95" }}>
                Compliance rules injected into every review cycle.
              </p>
            </div>
          </div>
          {!loading && data && (
            <span className="px-2.5 py-1 rounded-full text-[11px]"
              style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.15)", fontFamily: "var(--font-dm-mono)" }}>
              {(data.sebi.length + data.brand.length + data.legal.length)} total rules
            </span>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = data?.[tab.key].length ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-150 relative"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  color: isActive ? tab.color : "#8A8A95",
                  borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                  fontWeight: isActive ? 500 : 400,
                  background: "transparent",
                  border: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: isActive ? tab.color : "transparent",
                  cursor: "pointer",
                  paddingBottom: "10px",
                }}
              >
                {tab.label}
                {data && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? `${tab.color}18` : "rgba(0,0,0,0.05)",
                      color: isActive ? tab.color : "#9A9AA5",
                      fontFamily: "var(--font-dm-mono)",
                    }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={20} className="animate-spin" style={{ color: "#7C3AED" }} />
            <p className="text-sm" style={{ fontFamily: "var(--font-dm-mono)", color: "#9A9AA5" }}>
              Loading rules…
            </p>
          </div>
        ) : fetchError ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#DC2626", fontFamily: "var(--font-dm-sans)" }}>
                Failed to load rules
              </p>
              <p className="text-xs mt-1" style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}>
                {fetchError}
              </p>
              <button onClick={() => void fetchRules()}
                className="mt-4 px-4 py-2 rounded-lg text-xs transition-all duration-150"
                style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                Retry
              </button>
            </div>
          </div>
        ) : data && data[activeTab].length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${activeTabDef.color}10`, border: `1px solid ${activeTabDef.color}20` }}>
              <Settings size={24} style={{ color: `${activeTabDef.color}60` }} />
            </div>
            <p className="text-sm" style={{ color: "#6B6B75", fontFamily: "var(--font-dm-sans)" }}>
              No rules in this category yet.
            </p>
          </div>
        ) : data ? (
          <div className="grid gap-3 max-w-3xl">
            {data[activeTab].map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onSave={(updated) => handleSaveRule(activeTab, updated)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
