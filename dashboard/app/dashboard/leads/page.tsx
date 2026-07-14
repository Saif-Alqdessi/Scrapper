"use client";
import { useEffect, useState } from "react";
import { useLeadStore } from "@/lib/stores/lead-store";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import LeadTable from "@/components/LeadTable";

export default function LeadsPage() {
  const { leads, loading, fetchAll, fetchByCampaign } = useLeadStore();
  const { campaigns, fetch: fetchCampaigns } = useCampaignStore();
  const [selectedCampaign, setSelectedCampaign] = useState("");

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaign) fetchByCampaign(selectedCampaign);
    else fetchAll();
  }, [selectedCampaign, fetchAll, fetchByCampaign]);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-inface-text">Leads</h1>
        <p className="text-inface-muted text-sm mt-1">{leads.length} leads</p>
      </header>

      <select
        value={selectedCampaign}
        onChange={(e) => setSelectedCampaign(e.target.value)}
        className="bg-inface-surface border border-inface-border text-inface-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-inface-accent"
      >
        <option value="">All campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>{c.niche} — {c.location}</option>
        ))}
      </select>

      {loading
        ? <p className="text-inface-muted text-sm">Loading leads…</p>
        : <LeadTable leads={leads} />}
    </div>
  );
}
