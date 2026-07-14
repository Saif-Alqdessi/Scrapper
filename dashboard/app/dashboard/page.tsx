"use client";
import { useEffect } from "react";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import { CampaignCard } from "@/components/CampaignCard";
import CampaignForm from "@/components/CampaignForm";
import { StatsBar } from "@/components/StatsBar";

export default function DashboardPage() {
  const { campaigns, loading, fetch } = useCampaignStore();

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-inface-text">Dashboard</h1>
        <p className="text-inface-muted text-sm mt-1">Campaign and lead overview</p>
      </header>

      <StatsBar />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-inface-text">Campaigns</h2>
          <CampaignForm onCreated={fetch} />
        </div>
        {loading && <p className="text-inface-muted text-sm">Loading campaigns…</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => <CampaignCard key={c.id} campaign={c} onUpdate={fetch} />)}
        </div>
      </section>
    </div>
  );
}
