"use client";

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import LeadTable from '@/components/LeadTable';
import { api } from '@/lib/api';
import type { CampaignStatusResponse } from '@/lib/types';
import { useLeadStore } from '@/lib/stores/lead-store';

const ACTIVE_STATUSES = new Set(['pending', 'scraping', 'ai_running']);
const POLL_INTERVAL   = 3000;

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [status, setStatus] = useState<CampaignStatusResponse | null>(null);
  
  const { leads, fetchByCampaign } = useLeadStore();

  const poll = useCallback(async () => {
    try {
      const s = await api.campaigns.status(id);
      setStatus(s);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    fetchByCampaign(id);
  }, [poll, id, fetchByCampaign]);

  // Live 3-second polling while campaign is active
  useEffect(() => {
    if (!status) return;
    if (!ACTIVE_STATUSES.has(status.status)) return;
    const timer = setInterval(() => {
      poll();
      fetchByCampaign(id);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [poll, status, id, fetchByCampaign]);

  const isActive = status ? ACTIVE_STATUSES.has(status.status) : false;

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Back link */}
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 text-xs text-inface-muted hover:text-inface-text transition-colors duration-200 cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        All campaigns
      </Link>

      {/* Campaign header */}
      {status ? (
        <div className="rounded-2xl border border-inface-border bg-inface-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-bold text-inface-text text-xl">
                  Campaign Lead Results
                </h1>
                <StatusBadge status={status.status} />
                {isActive && (
                  <RefreshCw className="w-3.5 h-3.5 text-inface-success animate-spin" aria-label="Pipeline running" />
                )}
              </div>
              <p className="text-inface-muted text-xs">ID: {id}</p>
            </div>

            {/* Live counters */}
            <div className="flex items-center gap-6">
              <Counter value={status.total_leads}  label="Total"      color="text-inface-muted" />
              <Counter value={status.ready_leads}  label="Ready"      color="text-inface-success" />
              <Counter value={status.processing}   label="Processing" color="text-inface-warning" />
            </div>
          </div>

          {/* Progress bar */}
          {status.total_leads > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-inface-muted opacity-80 mb-1.5">
                <span>Pipeline progress</span>
                <span>{Math.round((status.ready_leads / status.total_leads) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-inface-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-inface-success transition-all duration-700"
                  style={{
                    width: `${(status.ready_leads / status.total_leads) * 100}%`,
                  }}
                  role="progressbar"
                  aria-valuenow={status.ready_leads}
                  aria-valuemax={status.total_leads}
                  aria-label="Leads ready"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 rounded-2xl bg-inface-surface border border-inface-border animate-pulse mb-6" />
      )}

      {/* Lead table */}
      <LeadTable leads={leads} />
    </div>
  );
}

function Counter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`font-bold text-2xl ${color}`}>{value}</div>
      <div className="text-inface-muted text-xs uppercase tracking-wider mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
