"use client";

import * as React from "react";
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

const AGENT_ICONS: Record<AgentName, string> = {
  drafter: "edit_note",
  compliance: "policy",
  localizer: "language",
  distributor: "send",
};

const AGENT_SUBTITLES: Record<AgentName, string> = {
  drafter: "llama-3.3-70b • Semantic Core",
  compliance: "llama-3.3-70b • Policy Engine",
  localizer: "gpt-oss-120b • Multi-Lingual",
  distributor: "llama-3.3-70b • Edge Delivery",
};

export default function PipelineStatus({ agents }: PipelineStatusProps) {
  return (
    <div className="flex flex-col gap-3">
      {agents.map((agent) => {
        const isRunning = agent.status === "running";
        const isComplete = agent.status === "complete";
        const isFailed = agent.status === "failed";

        return (
          <div
            key={agent.name}
            className={`bg-surface-container-lowest rounded-xl flex items-center justify-between transition-all duration-300 animate-agent-row-in ${
              isRunning
                ? "border-l-4 border-[#E8820C] p-5 shadow-sm scale-[1.02]"
                : isComplete
                ? "border-l-4 border-[#059669] p-4"
                : isFailed
                ? "border-l-4 border-red-500 p-4"
                : "border-l-4 border-slate-200 p-4 opacity-70"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon box */}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isRunning
                    ? "bg-[#FFF7ED] text-[#E8820C]"
                    : isComplete
                    ? "bg-[#F0FDF4] text-[#059669]"
                    : isFailed
                    ? "bg-red-50 text-red-500"
                    : "bg-[#F9FAFB] text-slate-400"
                }`}
              >
                {isRunning && (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                )}
                {isComplete && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                )}
                {isFailed && (
                  <span className="material-symbols-outlined">error</span>
                )}
                {!isRunning && !isComplete && !isFailed && (
                  <span className="material-symbols-outlined">
                    {AGENT_ICONS[agent.name]}
                  </span>
                )}
              </div>

              {/* Label */}
              <div>
                <p className="font-headline text-lg font-bold text-on-surface">
                  {agent.displayName}
                </p>
                <p
                  className={`font-mono text-[11px] uppercase ${
                    isRunning
                      ? "text-[#E8820C] font-medium"
                      : "text-slate-400"
                  }`}
                >
                  {agent.model ?? AGENT_SUBTITLES[agent.name]}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-4">
              {agent.durationMs !== undefined ? (
                <span className="font-mono text-xs text-slate-400">
                  {(agent.durationMs / 1000).toFixed(1)}s
                </span>
              ) : isRunning ? (
                <span className="font-mono text-xs text-[#E8820C] animate-pulse">—</span>
              ) : (
                <span className="font-mono text-xs text-slate-300">--</span>
              )}
              <span
                className={`px-2.5 py-1 rounded-md font-label text-[10px] font-bold uppercase tracking-wider ${
                  isRunning
                    ? "bg-[#FFF7ED] text-[#E8820C]"
                    : isComplete
                    ? "bg-[#F0FDF4] text-[#059669]"
                    : isFailed
                    ? "bg-red-50 text-red-500"
                    : "bg-[#F9FAFB] text-slate-400"
                }`}
              >
                {isRunning
                  ? "Running"
                  : isComplete
                  ? "Complete"
                  : isFailed
                  ? "Failed"
                  : "Waiting"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
