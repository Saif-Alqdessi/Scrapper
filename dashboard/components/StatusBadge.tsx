// components/StatusBadge.tsx
'use client';

import type { LeadStatus, CampaignStatus } from '@/lib/types';

type AnyStatus = LeadStatus | CampaignStatus;

const CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  // Lead statuses
  new:            { label: 'New',          bg: 'bg-slate-800 text-slate-300',   dot: 'bg-slate-400' },
  ai_processing:  { label: 'Processing',   bg: 'bg-amber-950 text-amber-400',   dot: 'bg-amber-400' },
  ready:          { label: 'Ready',        bg: 'bg-green-950 text-green-400',   dot: 'bg-green-400' },
  outreach_sent:  { label: 'Sent',         bg: 'bg-sky-950 text-sky-400',       dot: 'bg-sky-400' },
  replied:        { label: 'Replied',      bg: 'bg-purple-950 text-purple-400', dot: 'bg-purple-400' },
  closed:         { label: 'Closed',       bg: 'bg-green-900 text-green-300',   dot: 'bg-green-300' },
  rejected:       { label: 'Rejected',     bg: 'bg-red-950 text-red-400',       dot: 'bg-red-400' },
  // Campaign statuses
  pending:        { label: 'Pending',      bg: 'bg-slate-800 text-slate-300',   dot: 'bg-slate-400' },
  scraping:       { label: 'Scraping',     bg: 'bg-amber-950 text-amber-400',   dot: 'bg-amber-400' },
  ai_running:     { label: 'AI Running',   bg: 'bg-purple-950 text-purple-400', dot: 'bg-purple-400' },
  done:           { label: 'Done',         bg: 'bg-green-950 text-green-400',   dot: 'bg-green-400' },
  failed:         { label: 'Failed',       bg: 'bg-red-950 text-red-400',       dot: 'bg-red-400' },
  cancelled:      { label: 'Cancelled',    bg: 'bg-slate-900 text-slate-500',   dot: 'bg-slate-500' },
};

const PULSE_STATUSES = new Set(['pending', 'ai_processing', 'scraping', 'ai_running']);

export default function StatusBadge({ status }: { status: AnyStatus }) {
  const c = CONFIG[status] ?? { label: status, bg: 'bg-slate-800 text-slate-300', dot: 'bg-slate-400' };
  const isPulsing = PULSE_STATUSES.has(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono ${c.bg}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} ${isPulsing ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}
