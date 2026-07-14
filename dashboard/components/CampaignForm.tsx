// components/CampaignForm.tsx
// Roadmap §8: POST /api/v1/campaigns — niche, location, language fields
'use client';

import { useState } from 'react';
import { Play, MapPin, Crosshair, Globe } from 'lucide-react';
import { createCampaign } from '@/lib/api';
import type { Campaign } from '@/lib/types';

interface Props {
  onCreated: (c: Campaign) => void;
}

export default function CampaignForm({ onCreated }: Props) {
  const [niche,    setNiche]    = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState<'en' | 'ar' | 'both'>('both');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim() || !location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const campaign = await createCampaign({ niche: niche.trim(), location: location.trim(), language });
      onCreated(campaign);
      setNiche('');
      setLocation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-6 animate-fade-in"
      aria-label="New campaign form"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center">
          <Play className="w-4 h-4 text-[#22C55E]" fill="#22C55E" />
        </div>
        <div>
          <h2 className="font-mono font-semibold text-[#F8FAFC] text-base">New Campaign</h2>
          <p className="text-[#94A3B8] text-xs mt-0.5">Scrape → AI → wa.me links in minutes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Niche */}
        <div className="md:col-span-1">
          <label htmlFor="niche" className="block text-xs font-medium text-[#94A3B8] mb-1.5 font-mono">
            Niche / Business Type
          </label>
          <div className="relative">
            <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" strokeWidth={1.5} />
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="dental clinic"
              required
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#020617] border border-[#1E293B] text-[#F8FAFC] text-sm font-mono placeholder-[#334155] outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 transition-all duration-200"
            />
          </div>
        </div>

        {/* Location */}
        <div className="md:col-span-1">
          <label htmlFor="location" className="block text-xs font-medium text-[#94A3B8] mb-1.5 font-mono">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" strokeWidth={1.5} />
            <input
              id="location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Amman, Jordan"
              required
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#020617] border border-[#1E293B] text-[#F8FAFC] text-sm font-mono placeholder-[#334155] outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 transition-all duration-200"
            />
          </div>
        </div>

        {/* Language */}
        <div className="md:col-span-1">
          <label htmlFor="language" className="block text-xs font-medium text-[#94A3B8] mb-1.5 font-mono">
            Output Language
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" strokeWidth={1.5} />
            <select
              id="language"
              value={language}
              onChange={e => setLanguage(e.target.value as 'en' | 'ar' | 'both')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#020617] border border-[#1E293B] text-[#F8FAFC] text-sm font-mono outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 transition-all duration-200 cursor-pointer appearance-none"
            >
              <option value="both">Both (EN + AR)</option>
              <option value="en">English only</option>
              <option value="ar">Arabic only</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400 font-mono bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end mt-5">
        <button
          type="submit"
          disabled={loading || !niche.trim() || !location.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-mono font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50"
          style={{ boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Launching…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" fill="currentColor" />
              Run Pipeline
            </>
          )}
        </button>
      </div>
    </form>
  );
}
