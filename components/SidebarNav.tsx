"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/audit", label: "Audit Log", icon: "history_edu" },
  { href: "/admin/rules", label: "Rules Editor", icon: "rule" },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0A0A0C] flex flex-col py-6 z-50">
      {/* Logo */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center text-white font-bold font-label text-sm">
            CT
          </div>
          <div>
            <h1 className="text-white font-semibold tracking-widest font-label text-sm uppercase">
              ContentOS
            </h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">AI Pipeline</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-6 py-3 transition-all ${
                isActive
                  ? "bg-[#1E293B] text-white border-l-4 border-[#E8820C]"
                  : "text-slate-400 hover:bg-[#1E293B] hover:text-white border-l-4 border-transparent"
              }`}
            >
              <span
                className={`material-symbols-outlined mr-3 ${isActive ? "text-[#E8820C]" : ""}`}
              >
                {icon}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-label font-semibold">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-6 pt-6">
        <div className="flex items-center gap-3 text-slate-500 px-2 py-3">
          <span className="material-symbols-outlined text-sm">terminal</span>
          <span className="text-[9px] uppercase tracking-tighter font-label">
            ET AI Hackathon 2026
          </span>
        </div>
      </div>
    </aside>
  );
}
