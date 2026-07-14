// dashboard/lib/stores/campaign-store.ts
import { create } from "zustand";
import { api } from "../api";
import type { Campaign } from "../types";

interface CampaignStore {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  fetch: () => Promise<void>;
  select: (id: string | null) => void;
  optimisticUpdate: (id: string, patch: Partial<Campaign>) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  loading: false,
  error: null,
  selectedId: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const campaigns = await api.campaigns.list();
      set({ campaigns, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  select: (id) => set({ selectedId: id }),

  optimisticUpdate: (id, patch) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}));
