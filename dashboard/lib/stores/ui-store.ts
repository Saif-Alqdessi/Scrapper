// dashboard/lib/stores/ui-store.ts
import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  activeTab: "campaigns" | "leads";
  toggleSidebar: () => void;
  setTab: (tab: "campaigns" | "leads") => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeTab: "campaigns",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTab: (tab) => set({ activeTab: tab }),
}));
