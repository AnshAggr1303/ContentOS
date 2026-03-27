"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/rules", label: "Rules Editor", icon: Settings },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-[218px] h-full flex flex-col shrink-0 border-r border-white/[0.04]"
      style={{ background: "#0A0A0C" }}>
      {/* Logo mark */}
      <div className="px-5 pt-7 pb-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          {/* ET amber dot mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#E8820C" }}
          >
            <span className="text-white text-xs font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
              ET
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-tight leading-none"
              style={{ fontFamily: "var(--font-playfair)" }}>
              ContentOS
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#4B4B55", fontFamily: "var(--font-dm-mono)" }}>
              AI Pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[9px] uppercase tracking-widest px-3 mb-3"
          style={{ color: "#3A3A42", fontFamily: "var(--font-dm-mono)" }}>
          Navigation
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group"
              style={{
                color: isActive ? "#F5F5F5" : "#5A5A65",
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                borderLeft: isActive ? "2px solid #E8820C" : "2px solid transparent",
                paddingLeft: isActive ? "10px" : "12px",
              }}
            >
              <Icon
                size={14}
                style={{ color: isActive ? "#E8820C" : "#4A4A55" }}
                className="transition-colors duration-150 group-hover:text-zinc-300"
              />
              <span style={{ fontFamily: "var(--font-dm-sans)" }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Agent count indicator */}
      <div className="px-4 pb-2">
        <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(232,130,12,0.08)", border: "1px solid rgba(232,130,12,0.12)" }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#E8820C", fontFamily: "var(--font-dm-mono)" }}>
            Pipeline
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "#6B6B75", fontFamily: "var(--font-dm-mono)" }}>
              4 active agents
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 h-3 rounded-full"
                  style={{ background: "#E8820C", opacity: 0.3 + i * 0.18 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.04]">
        <p className="text-[10px] leading-relaxed" style={{ color: "#3A3A42", fontFamily: "var(--font-dm-mono)" }}>
          ET AI Hackathon 2026
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "#2E2E36", fontFamily: "var(--font-dm-mono)" }}>
          Problem Statement 1
        </p>
      </div>
    </aside>
  );
}
