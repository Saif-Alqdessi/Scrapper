"use client";

import { useState } from 'react';
import LeadRow from './LeadRow';
import type { Lead } from '@/lib/types';
import { useLeadStore } from '@/lib/stores/lead-store';

interface Props { leads: Lead[] }

export default function LeadTable({ leads }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const { optimisticUpdate } = useLeadStore();

  function handleStatusChange(id: string, updated: Lead) {
    optimisticUpdate(id, updated);
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key: 'all',           label: 'All' },
    { key: 'ready',         label: 'Ready' },
    { key: 'ai_processing', label: 'Processing' },
    { key: 'outreach_sent', label: 'Sent' },
    { key: 'new',           label: 'New' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              filter === f.key
                ? 'bg-inface-accent/10 text-inface-accent border border-inface-accent/30'
                : 'bg-inface-surface text-inface-muted border border-inface-border hover:border-inface-muted'
            }`}
          >
            {f.label}
            {f.key !== 'all' && statusCounts[f.key] ? (
              <span className="ml-1.5 opacity-70">({statusCounts[f.key]})</span>
            ) : f.key === 'all' && leads.length ? (
              <span className="ml-1.5 opacity-70">({leads.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-inface-muted text-sm">
          {leads.length === 0
            ? 'No leads yet.'
            : `No leads matching "${filter}"`}
        </div>
      ) : (
        <div className="rounded-2xl border border-inface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-inface-border bg-inface-surface">
                {['Business', 'Rating', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-inface-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-inface-bg">
              {filtered.map(lead => (
                <LeadRow key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
