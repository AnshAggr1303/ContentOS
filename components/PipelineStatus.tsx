"use client";

import * as React from "react";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { AgentName } from "@/lib/types";

export interface AgentProgress {
  name: AgentName;
  displayName: string;
  status: "waiting" | "running" | "complete" | "failed";
  model?: string;
  durationMs?: number;
}

interface PipelineStatusProps {
  agents: AgentProgress[];
}

const AGENT_STEP_LABELS: Record<AgentName, string> = {
  drafter: "Drafting article in ET journalist style",
  compliance: "Checking SEBI, brand & legal rules",
  localizer: "Translating to 4 Indian languages",
  distributor: "Formatting for 5 channels",
};

export default function PipelineStatus({ agents }: PipelineStatusProps) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "#9A9AA5", fontFamily: "var(--font-dm-mono)" }}
        >
          Pipeline Progress
        </h3>
        <span
          className="text-[10px]"
          style={{ color: "#6B6B75", fontFamily: "var(--font-dm-mono)" }}
        >
          {agents.filter((a) => a.status === "complete").length}/{agents.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-200 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${(agents.filter((a) => a.status === "complete").length / agents.length) * 100}%`,
            background: "#E8820C",
          }}
        />
      </div>

      <div className="space-y-2.5">
        {agents.map((agent, i) => (
          <div
            key={agent.name}
            className="animate-agent-row-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300"
              style={{
                background:
                  agent.status === "running"
                    ? "rgba(232,130,12,0.04)"
                    : agent.status === "complete"
                      ? "rgba(5,150,105,0.03)"
                      : agent.status === "failed"
                        ? "rgba(220,38,38,0.04)"
                        : "#FFFFFF",
                borderColor:
                  agent.status === "running"
                    ? "rgba(232,130,12,0.25)"
                    : agent.status === "complete"
                      ? "rgba(5,150,105,0.2)"
                      : agent.status === "failed"
                        ? "rgba(220,38,38,0.2)"
                        : "#EBEBEB",
              }}
            >
              {/* Step number / status icon */}
              <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                {agent.status === "waiting" && (
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      borderColor: "#E0E0E0",
                      color: "#C0C0C0",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {i + 1}
                  </div>
                )}
                {agent.status === "running" && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: "#E8820C" }}
                  />
                )}
                {agent.status === "complete" && (
                  <CheckCircle size={18} style={{ color: "#059669" }} />
                )}
                {agent.status === "failed" && (
                  <AlertCircle size={18} style={{ color: "#DC2626" }} />
                )}
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        agent.status === "waiting" ? "#AAAAAA" : "#1A1A1A",
                    }}
                  >
                    {agent.displayName}
                  </span>
                  {agent.status === "running" && (
                    <span
                      className="text-[10px] animate-pulse-amber"
                      style={{ color: "#E8820C", fontFamily: "var(--font-dm-mono)" }}
                    >
                      processing
                    </span>
                  )}
                </div>
                {agent.status === "waiting" ? (
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "#D0D0D0", fontFamily: "var(--font-dm-sans)" }}
                  >
                    {AGENT_STEP_LABELS[agent.name]}
                  </p>
                ) : agent.model ? (
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "#8A8A95", fontFamily: "var(--font-dm-mono)" }}
                  >
                    {agent.model}
                  </p>
                ) : (
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "#8A8A95", fontFamily: "var(--font-dm-sans)" }}
                  >
                    {AGENT_STEP_LABELS[agent.name]}
                  </p>
                )}
              </div>

              {/* Duration or status pill */}
              <div className="shrink-0 flex items-center gap-2">
                {agent.durationMs !== undefined && (
                  <div
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: "#8A8A95", fontFamily: "var(--font-dm-mono)" }}
                  >
                    <Clock size={10} />
                    {(agent.durationMs / 1000).toFixed(1)}s
                  </div>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      agent.status === "running"
                        ? "rgba(232,130,12,0.12)"
                        : agent.status === "complete"
                          ? "rgba(5,150,105,0.1)"
                          : agent.status === "failed"
                            ? "rgba(220,38,38,0.1)"
                            : "#F4F4F6",
                    color:
                      agent.status === "running"
                        ? "#E8820C"
                        : agent.status === "complete"
                          ? "#059669"
                          : agent.status === "failed"
                            ? "#DC2626"
                            : "#BEBEC8",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {agent.status === "running"
                    ? "running"
                    : agent.status === "complete"
                      ? "done"
                      : agent.status === "failed"
                        ? "failed"
                        : "queue"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
