// lib/store.ts
// Zustand campaign store — single source of truth for campaign list.
// All pages and components read from / write to this store so that
// Delete / Cancel / Retry operations instantly reflect across the UI
// without needing a full page re-fetch.

import { create } from 'zustand';
import type { Campaign } from './types';

interface CampaignStore {
  campaigns: Campaign[];
  loading: boolean;

  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setLoading: (loading: boolean) => void;
  addCampaign: (campaign: Campaign) => void;
  removeCampaign: (id: string) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  loading: true,

  setCampaigns: (campaigns) => set({ campaigns }),
  setLoading:   (loading)   => set({ loading }),

  addCampaign: (campaign) =>
    set((state) => ({ campaigns: [campaign, ...state.campaigns] })),

  removeCampaign: (id) =>
    set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) })),

  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));
