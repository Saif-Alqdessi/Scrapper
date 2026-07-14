"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { TrendingUp, Users, Activity, CheckCircle } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-inface-surface border border-inface-border rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-inface-muted text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-inface-text text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export function StatsBar() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.stats.summary().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="grid grid-cols-4 gap-4"><div className="col-span-4 h-20 animate-pulse bg-inface-surface rounded-xl" /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Leads"      value={stats.total_leads}                     icon={Users}       color="bg-inface-accent/10 text-inface-accent" />
      <StatCard label="Ready to Send"    value={stats.leads_by_status.ready ?? 0}      icon={CheckCircle} color="bg-green-500/10 text-green-400" />
      <StatCard label="Active Campaigns" value={stats.active_campaigns}                icon={Activity}    color="bg-yellow-500/10 text-yellow-400" />
      <StatCard label="Done Campaigns"   value={stats.done_campaigns}                  icon={TrendingUp}  color="bg-inface-accent/10 text-inface-accent" />
    </div>
  );
}
