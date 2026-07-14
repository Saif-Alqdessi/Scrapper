"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight, Users, Cpu, CheckCircle, AlertCircle,
  Trash2, Square, RotateCcw, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCampaignStore } from '@/lib/stores/campaign-store';
import { useCampaignPoller } from '@/hooks/useCampaignPoller';
import StatusBadge from './StatusBadge';
import type { Campaign, CampaignStatusResponse } from '@/lib/types';

const ACTIVE_STATUSES  = new Set(['pending', 'scraping', 'ai_running']);
const STOP_STATUSES    = new Set(['pending', 'scraping', 'ai_running']);
const RETRY_STATUSES   = new Set(['failed', 'cancelled']);

interface Props { 
  campaign: Campaign;
  onUpdate?: () => void;
}

export function CampaignCard({ campaign, onUpdate }: Props) {
  const { optimisticUpdate } = useCampaignStore();
  const { liveStatus, setLiveStatus } = useCampaignPoller(campaign.id, campaign.status);
  const [actionBusy,  setActionBusy] = useState<'delete' | 'stop' | 'retry' | null>(null);
  const [confirmDel,  setConfirmDel] = useState(false);   // two-step delete confirm

  const currentStatus = liveStatus?.status ?? campaign.status;
  const isActive      = ACTIVE_STATUSES.has(currentStatus);
  const canStop       = STOP_STATUSES.has(currentStatus);
  const canRetry      = RETRY_STATUSES.has(currentStatus);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDel) {
      setConfirmDel(true);
      // Auto-reset confirm state after 3 s
      setTimeout(() => setConfirmDel(false), 3000);
      return;
    }

    setActionBusy('delete');
    try {
      await api.campaigns.delete(campaign.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setActionBusy(null);
      setConfirmDel(false);
    }
  }

  async function handleStop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActionBusy('stop');
    try {
      const updated = await api.campaigns.cancel(campaign.id);
      optimisticUpdate(campaign.id, { status: updated.status });
      setLiveStatus((prev: CampaignStatusResponse | null) => prev ? { ...prev, status: updated.status } : null);
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActionBusy('retry');
    try {
      const updated = await api.campaigns.retry(campaign.id);
      optimisticUpdate(campaign.id, { status: updated.status });
      setLiveStatus((prev: CampaignStatusResponse | null) => prev ? { ...prev, status: updated.status } : null);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setActionBusy(null);
    }
  }

  const totalLeads = liveStatus?.total_leads ?? 0;
  const readyLeads = liveStatus?.ready_leads ?? 0;
  const processing = liveStatus?.processing  ?? 0;
  const createdAt  = new Date(campaign.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <article
      className="group relative rounded-2xl border border-inface-border bg-inface-surface p-5 transition-all duration-200 hover:border-inface-muted hover:shadow-lg animate-fade-in"
      style={{ boxShadow: isActive ? '0 0 0 1px rgba(37,99,235,0.2)' : undefined }}
      aria-label={`Campaign: ${campaign.niche} in ${campaign.location}`}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: niche + status */}
        <Link href={`/dashboard/campaigns/${campaign.id}`} className="min-w-0 flex-1 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-inface-text text-sm truncate">{campaign.niche}</h3>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-xs text-inface-muted truncate">{campaign.location}</p>
          <p className="text-xs text-inface-muted opacity-80 mt-0.5">{createdAt}</p>
        </Link>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Stop button — only when active */}
          {canStop && (
            <ActionButton
              id={`stop-${campaign.id}`}
              busy={actionBusy === 'stop'}
              onClick={handleStop}
              title="Stop pipeline"
              icon={<Square className="w-3.5 h-3.5" fill="currentColor" />}
              colorClass="text-inface-warning hover:bg-inface-warning/10"
            />
          )}

          {/* Retry button — only when failed or cancelled */}
          {canRetry && (
            <ActionButton
              id={`retry-${campaign.id}`}
              busy={actionBusy === 'retry'}
              onClick={handleRetry}
              title="Retry pipeline"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              colorClass="text-inface-accent hover:bg-inface-accent/10"
            />
          )}

          {/* Delete button — always visible, two-step confirm */}
          <ActionButton
            id={`delete-${campaign.id}`}
            busy={actionBusy === 'delete'}
            onClick={handleDelete}
            title={confirmDel ? 'Click again to confirm delete' : 'Delete campaign'}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            colorClass={
              confirmDel
                ? 'text-inface-danger bg-inface-danger/10 ring-1 ring-inface-danger/40 animate-pulse'
                : 'text-inface-muted hover:bg-inface-danger/10 hover:text-inface-danger'
            }
          />

          {/* Navigation arrow */}
          <Link
            href={`/dashboard/campaigns/${campaign.id}`}
            className="p-1.5 rounded-lg text-inface-muted hover:text-inface-text transition-colors duration-200 cursor-pointer"
            aria-label="View campaign details"
          >
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Lead counters ────────────────────────────────────────────────── */}
      {totalLeads > 0 && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-inface-border">
          <Stat icon={<Users className="w-3.5 h-3.5" />}        value={totalLeads} label="total"      color="text-inface-muted" />
          <Stat icon={<CheckCircle className="w-3.5 h-3.5" />}  value={readyLeads} label="ready"      color="text-inface-success" />
          <Stat icon={<Cpu className="w-3.5 h-3.5" />}          value={processing} label="processing" color="text-inface-warning" />
        </div>
      )}

      {/* ── Failure / cancel notice ──────────────────────────────────────── */}
      {(currentStatus === 'failed' || currentStatus === 'cancelled') && (
        <div className={`flex items-center gap-1.5 mt-3 text-xs ${
          currentStatus === 'failed' ? 'text-inface-danger' : 'text-inface-muted'
        }`}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {currentStatus === 'failed'
            ? 'Pipeline failed — click Retry to restart'
            : 'Campaign was stopped — click Retry to restart'}
        </div>
      )}
    </article>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionButton({
  id, busy, onClick, title, icon, colorClass,
}: {
  id: string;
  busy: boolean;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <button
      id={id}
      type="button"
      disabled={busy}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
    >
      {busy
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : icon}
    </button>
  );
}

function Stat({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      {icon}
      <span className="font-semibold">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}
