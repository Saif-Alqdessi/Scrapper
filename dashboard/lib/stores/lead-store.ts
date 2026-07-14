// dashboard/lib/stores/lead-store.ts
import { create } from "zustand";
import { api } from "../api";
import type { Lead } from "../types";

interface LeadStore {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchByCampaign: (campaignId: string) => Promise<void>;
  patchStatus: (leadId: string, status: string) => Promise<void>;
  optimisticUpdate: (leadId: string, lead: Lead) => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const leads = await api.leads.list();
      set({ leads, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchByCampaign: async (campaignId) => {
    set({ loading: true, error: null });
    try {
      const leads = await api.leads.list(campaignId);
      set({ leads, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  patchStatus: async (leadId, status) => {
    // Optimistic update — revert on error
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, status: status as Lead["status"] } : l
      ),
    }));
    try {
      const updated = await api.leads.updateStatus(leadId, status);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      get().fetchAll(); // revert optimistic update
    }
  },

  optimisticUpdate: (leadId, lead) => {
    set((state) => ({
      leads: state.leads.map((l) => (l.id === leadId ? lead : l)),
    }));
  },
}));
