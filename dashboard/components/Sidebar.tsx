"use client";
import Link from "next/link";
import { LayoutDashboard, Target, Users, ChevronLeft } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";

const NAV = [
  { label: "Overview",  href: "/dashboard",        icon: LayoutDashboard },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Target },
  { label: "Leads",     href: "/dashboard/leads",   icon: Users },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={`flex flex-col h-screen bg-inface-surface border-r border-inface-border transition-all duration-200 ${sidebarOpen ? "w-56" : "w-14"}`}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-inface-border">
        {sidebarOpen && <span className="text-inface-text font-bold text-lg">Inface</span>}
        <button onClick={toggleSidebar} className="text-inface-muted hover:text-inface-text transition-colors" aria-label="Toggle sidebar">
          <ChevronLeft size={18} className={`transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-inface-muted hover:text-inface-text hover:bg-inface-border transition-colors">
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-inface-border">
          <p className="text-xs text-inface-muted">LeadForge v1.0</p>
        </div>
      )}
    </aside>
  );
}
