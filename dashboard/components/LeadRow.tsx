"use client";

import { useState } from 'react';
import { MessageCircle, Eye, CheckCheck, Copy } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { api } from '@/lib/api';
import type { Lead } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface Props {
  lead: Lead;
  onStatusChange: (id: string, lead: Lead) => void;
}

export default function LeadRow({ lead, onStatusChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function markSent() {
    setBusy(true);
    try {
      await api.leads.updateStatus(lead.id, 'outreach_sent');
      onStatusChange(lead.id, { ...lead, status: 'outreach_sent' });
    } finally { setBusy(false); }
  }

  async function copyPayload(lang: 'en' | 'ar') {
    const url = `${API_BASE}/api/v1/preview/${lead.slug}?lang=${lang}`;
    try {
      const res  = await fetch(url);
      const json = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    } catch { /* silent */ }
  }

  const isReady    = lead.status === 'ready';
  const isSent     = lead.status === 'outreach_sent';
  const hasWame    = !!lead.wame_link;
  const hasSlug    = !!lead.slug;

  return (
    <tr className="border-b border-inface-border hover:bg-inface-surface/50 transition-colors duration-150 group">
      {/* Business */}
      <td className="px-4 py-3.5 min-w-0">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-inface-text text-sm truncate max-w-[220px]">
            {lead.business_name}
          </span>
          <span className="text-inface-muted text-xs truncate">{lead.address ?? lead.slug}</span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-4 py-3.5 text-center">
        {lead.google_rating ? (
          <span className="text-sm text-inface-success font-semibold">
            {lead.google_rating.toFixed(1)}
            <span className="text-inface-success/60 text-xs ml-0.5">★</span>
          </span>
        ) : <span className="text-inface-muted text-xs">—</span>}
        {lead.review_count ? (
          <div className="text-inface-muted text-xs">{lead.review_count} reviews</div>
        ) : null}
      </td>

      {/* Phone */}
      <td className="px-4 py-3.5">
        <span className="text-xs text-inface-muted">{lead.phone ?? '—'}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <StatusBadge status={lead.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasSlug && (
            <a
              href={`${API_BASE}/api/v1/preview/${lead.slug!}?lang=en`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-inface-surface hover:bg-inface-border text-inface-muted hover:text-inface-text text-xs transition-all duration-200 cursor-pointer"
              title="Preview English landing page"
            >
              <Eye className="w-3 h-3" /> EN
            </a>
          )}

          {hasWame && isReady && (
            <a
              href={lead.wame_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-950 hover:bg-green-900 border border-green-800/60 text-[#22C55E] text-xs font-semibold transition-all duration-200 cursor-pointer"
              title="Open WhatsApp with pre-filled EN message"
            >
              <MessageCircle className="w-3 h-3" fill="currentColor" /> WA EN
            </a>
          )}

          {hasSlug && isReady && (
            <button
              onClick={() => copyPayload('en')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-inface-surface hover:bg-inface-border text-inface-muted hover:text-inface-text text-xs transition-all duration-200 cursor-pointer"
              title="Copy JSON payload (EN)"
            >
              <Copy className="w-3 h-3" /> JSON
            </button>
          )}

          {isReady && !isSent && (
            <button
              onClick={markSent}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800/60 text-sky-400 text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-3 h-3" /> Mark Sent
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
