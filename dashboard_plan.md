# Inface Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the "Inface" dashboard — a production-ready Next.js 16 frontend that lets the operator manage campaigns and leads produced by the LeadForge backend, with zero AI/LLM integration on the frontend.

**Architecture:** App Router (Next.js 16), Tailwind CSS v3, Zustand v5 for client state; all server data fetched via `fetch()` from the existing FastAPI backend at `NEXT_PUBLIC_API_URL`. No external UI libraries beyond `lucide-react` (already installed). Sidebar layout with a Campaign panel and a Lead Data Grid.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 3 · Zustand 5 · Lucide React · FastAPI backend (Render, port 10000)

---

## Existing State (Read Before Starting)

### Dashboard — already exists at `dashboard/`

| File | Status |
|------|--------|
| `app/layout.tsx` | Root layout — needs Sidebar wrapper |
| `app/page.tsx` | Redirects to `/dashboard` (placeholder) |
| `app/dashboard/page.tsx` | 5 KB — partially built dashboard page |
| `app/dashboard/campaigns/` | Directory exists |
| `components/CampaignCard.tsx` | 10 KB — exists, reuse |
| `components/CampaignForm.tsx` | 6 KB — exists, reuse |
| `components/LeadTable.tsx` | 5 KB — exists, reuse |
| `components/LeadRow.tsx` | 8 KB — exists, reuse |
| `components/Navbar.tsx` | 1.4 KB — may be replaced by Sidebar |
| `components/StatusBadge.tsx` | 2.3 KB — exists, reuse |

### Backend — fully implemented at `backend/`

| Endpoint | Method | Notes |
|----------|--------|-------|
| `GET /api/v1/campaigns/` | EXISTS | List all campaigns |
| `GET /api/v1/campaigns/{id}` | EXISTS | Campaign detail |
| `GET /api/v1/campaigns/{id}/status` | EXISTS | Lightweight poll (counts only) |
| `POST /api/v1/campaigns/` | EXISTS | Create + start Apify run |
| `POST /api/v1/campaigns/{id}/cancel` | EXISTS | Abort run |
| `POST /api/v1/campaigns/{id}/retry` | EXISTS | Retry failed |
| `DELETE /api/v1/campaigns/{id}` | EXISTS | Delete campaign + leads |
| `GET /api/v1/leads/` | EXISTS | List leads (?campaign_id=&status=) |
| `GET /api/v1/leads/{id}` | EXISTS | Lead detail |
| `PATCH /api/v1/leads/{id}/status` | EXISTS | Update lifecycle status |
| `GET /health` | EXISTS | Health check |

### Missing Backend Endpoints (must be added)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/stats/summary` | MISSING | Dashboard KPI cards |
| `PATCH /api/v1/leads/{id}` | MISSING | Full lead field update (notes, phone correction) |

---

## Code Quality Constraints (Non-Negotiable)

- **DRY:** Every API call goes through a single `lib/api.ts` client. No `fetch()` in components.
- **KISS:** No abstractions that are not used in at least 2 places. No premature generics.
- **SOLID:** Each Zustand store slice owns one domain (campaigns, leads, UI). No god-stores.
- **YAGNI:** No feature flags, no i18n, no theming system — just dark Inface theme via Tailwind.
- **Types:** Every API response has a TypeScript interface in `lib/types.ts`. No `any`.

---

## Phase 1 — Project Setup and Environment

### Task 1.1: Verify dependencies

**Files:**
- Audit: `dashboard/package.json`

**Step 1: Confirm zustand is in node_modules**

```bash
cd dashboard
npm ls zustand
```
Expected: `zustand@5.0.x`

**Step 2: Verify dev server starts**

```bash
npm run dev
```
Expected: server on 0.0.0.0:3000

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore: verify dashboard dependencies"
```

---

### Task 1.2: Configure environment

**Files:**
- Modify: `dashboard/.env.local`

**Step 1: Ensure it contains:**

```env
NEXT_PUBLIC_API_URL=https://leadforge-api.onrender.com
```

For local dev:
```env
# NEXT_PUBLIC_API_URL=http://localhost:10000
```

**Step 2: Commit**

```bash
git add dashboard/.env.local
git commit -m "chore: configure NEXT_PUBLIC_API_URL"
```

---

### Task 1.3: Create shared TypeScript types

**Files:**
- Create: `dashboard/lib/types.ts`

**Step 1: Write the file**

```typescript
// dashboard/lib/types.ts
export type CampaignStatus =
  | "pending" | "scraping" | "ai_running"
  | "done" | "failed" | "cancelled";

export type LeadStatus =
  | "new" | "ai_processing" | "ready"
  | "outreach_sent" | "replied" | "closed" | "rejected";

export interface Campaign {
  id: string;
  niche: string;
  location: string;
  language: string;
  status: CampaignStatus;
  apify_run_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CampaignStatusPoll {
  campaign_id: string;
  status: CampaignStatus;
  total_leads: number;
  ready_leads: number;
  processing: number;
}

export interface Lead {
  id: string;
  campaign_id: string;
  slug: string;
  business_name: string;
  google_place_id: string | null;
  google_rating: number | null;
  review_count: number | null;
  phone: string | null;
  address: string | null;
  website_url: string | null;
  has_website: boolean;
  maps_url: string | null;
  status: LeadStatus;
  preview_url: string | null;
  wame_link: string | null;
  wame_link_ar: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_leads: number;
  leads_by_status: Record<LeadStatus, number>;
  active_campaigns: number;
  done_campaigns: number;
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add dashboard/lib/types.ts
git commit -m "feat: add shared TypeScript types for API responses"
```

---

### Task 1.4: Create the API client

**Files:**
- Create: `dashboard/lib/api.ts`

**Step 1: Write the file**

```typescript
// dashboard/lib/api.ts
// ALL backend communication goes through this module.
// NEVER call fetch() directly from a component.

import type { Campaign, CampaignStatusPoll, Lead, DashboardStats } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:10000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  campaigns: {
    list: () => request<Campaign[]>("/api/v1/campaigns/"),
    get: (id: string) => request<Campaign>(`/api/v1/campaigns/${id}`),
    status: (id: string) => request<CampaignStatusPoll>(`/api/v1/campaigns/${id}/status`),
    create: (payload: { niche: string; location: string; language: string }) =>
      request<Campaign>("/api/v1/campaigns/", { method: "POST", body: JSON.stringify(payload) }),
    cancel: (id: string) =>
      request<Campaign>(`/api/v1/campaigns/${id}/cancel`, { method: "POST" }),
    retry: (id: string) =>
      request<Campaign>(`/api/v1/campaigns/${id}/retry`, { method: "POST" }),
    delete: (id: string) =>
      request<void>(`/api/v1/campaigns/${id}`, { method: "DELETE" }),
  },
  leads: {
    list: (params?: { campaign_id?: string; status?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][]
      ).toString();
      return request<Lead[]>(`/api/v1/leads/${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Lead>(`/api/v1/leads/${id}`),
    updateStatus: (id: string, new_status: string) =>
      request<Lead>(`/api/v1/leads/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ new_status }),
      }),
    update: (id: string, patch: Partial<Lead>) =>
      request<Lead>(`/api/v1/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
  },
  stats: {
    // Requires Task 2.1 (backend) to be implemented first
    summary: () => request<DashboardStats>("/api/v1/stats/summary"),
  },
};
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add dashboard/lib/api.ts
git commit -m "feat: add centralized API client"
```

---

### Task 1.5: Create Zustand stores

**Files:**
- Create: `dashboard/lib/stores/campaign-store.ts`
- Create: `dashboard/lib/stores/lead-store.ts`
- Create: `dashboard/lib/stores/ui-store.ts`

**Step 1: Write `campaign-store.ts`**

```typescript
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
```

**Step 2: Write `lead-store.ts`**

```typescript
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
      const leads = await api.leads.list({ campaign_id: campaignId });
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
}));
```

**Step 3: Write `ui-store.ts`**

```typescript
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
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add dashboard/lib/stores/
git commit -m "feat: add Zustand stores for campaigns, leads, and UI state"
```

---

## Phase 2 — Backend: Missing Endpoints

### Task 2.1: Add `GET /api/v1/stats/summary`

**Files:**
- Create: `backend/app/api/v1/stats.py`
- Modify: `backend/app/main.py` (lines 71-94)

**Step 1: Write `stats.py`**

```python
"""
app/api/v1/stats.py
Dashboard KPI endpoint — aggregate counts only.
No AI, no heavy joins.
"""
import logging
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.lead import Lead, LeadStatus

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary", summary="Dashboard KPI summary")
async def get_stats_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns aggregate counts for the dashboard KPI cards.
    Two GROUP BY queries — single round-trip per call.
    """
    lead_rows = await db.execute(
        select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
    )
    leads_by_status: dict[str, int] = defaultdict(int)
    total_leads = 0
    for row_status, count in lead_rows:
        leads_by_status[row_status.value] = count
        total_leads += count

    camp_rows = await db.execute(
        select(Campaign.status, func.count(Campaign.id)).group_by(Campaign.status)
    )
    active_statuses = {
        CampaignStatus.PENDING,
        CampaignStatus.SCRAPING,
        CampaignStatus.AI_RUNNING,
    }
    active_campaigns, done_campaigns = 0, 0
    for row_status, count in camp_rows:
        if row_status in active_statuses:
            active_campaigns += count
        elif row_status == CampaignStatus.DONE:
            done_campaigns += count

    return {
        "total_leads": total_leads,
        "leads_by_status": dict(leads_by_status),
        "active_campaigns": active_campaigns,
        "done_campaigns": done_campaigns,
    }
```

**Step 2: Register in `backend/app/main.py`**

Find the router imports block (line 71) and add `stats`:

```python
from app.api.v1 import campaigns, leads, preview, webhooks, stats

# Add after the existing routers:
app.include_router(
    stats.router,
    prefix="/api/v1/stats",
    tags=["stats"],
)
```

**Step 3: Test locally**

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 10000 --reload
curl http://localhost:10000/api/v1/stats/summary
```

Expected:
```json
{"total_leads": 42, "leads_by_status": {"ready": 30, "new": 10}, "active_campaigns": 1, "done_campaigns": 5}
```

**Step 4: Commit**

```bash
git add backend/app/api/v1/stats.py backend/app/main.py
git commit -m "feat: add GET /api/v1/stats/summary for dashboard KPIs"
```

---

### Task 2.2: Add `PATCH /api/v1/leads/{id}` (full update)

**Files:**
- Modify: `backend/app/api/v1/leads.py`
- Modify: `backend/app/schemas/lead_api.py`

**Step 1: Add `LeadUpdate` schema to `lead_api.py`**

```python
class LeadUpdate(BaseModel):
    """Fields the dashboard operator can correct manually."""
    phone: str | None = None
    address: str | None = None
    website_url: str | None = None
```

**Step 2: Add PATCH endpoint to `leads.py`**

```python
@router.patch(
    "/{lead_id}",
    response_model=LeadSummaryResponse,
    summary="Update lead fields (phone correction, etc.)",
)
async def update_lead(
    lead_id: uuid.UUID,
    body: LeadUpdate,
    db: AsyncSession = Depends(get_db),
) -> Lead:
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # PATCH semantics: only update explicitly provided fields
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead
```

**Step 3: Test**

```bash
curl -X PATCH http://localhost:10000/api/v1/leads/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"phone": "+962799000000"}'
```

Expected: `200 OK` with updated lead JSON.

**Step 4: Commit**

```bash
git add backend/app/api/v1/leads.py backend/app/schemas/lead_api.py
git commit -m "feat: add PATCH /api/v1/leads/{id} for field corrections"
```

---

## Phase 3 — UI: Inface Layout and Components

### Task 3.1: Inface design tokens

**Files:**
- Modify: `dashboard/tailwind.config.ts`

**Step 1: Add Inface brand colors**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        inface: {
          bg:           "#0f1117",
          surface:      "#1a1d27",
          border:       "#2a2d3a",
          accent:       "#6c6cff",
          "accent-hover": "#5a5ae8",
          muted:        "#6b7280",
          text:         "#e5e7eb",
          success:      "#10b981",
          warning:      "#f59e0b",
          danger:       "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Add Inter to `app/layout.tsx`**

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

**Step 3: Commit**

```bash
git add dashboard/tailwind.config.ts dashboard/app/layout.tsx
git commit -m "feat: add Inface design tokens to Tailwind config"
```

---

### Task 3.2: Sidebar component

**Files:**
- Create: `dashboard/components/Sidebar.tsx`
- Modify: `dashboard/app/layout.tsx`

**Step 1: Write `Sidebar.tsx`**

```typescript
// dashboard/components/Sidebar.tsx
"use client";
import Link from "next/link";
import { LayoutDashboard, Target, Users, ChevronLeft } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";

const NAV = [
  { label: "Overview",  href: "/dashboard",        icon: LayoutDashboard },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Target },
  { label: "Leads",     href: "/dashboard/leads",   icon: Users },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={`flex flex-col h-screen bg-inface-surface border-r border-inface-border transition-all duration-200 ${sidebarOpen ? "w-56" : "w-14"}`}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-inface-border">
        {sidebarOpen && <span className="text-inface-text font-bold text-lg">Inface</span>}
        <button onClick={toggleSidebar} className="text-inface-muted hover:text-inface-text transition-colors" aria-label="Toggle sidebar">
          <ChevronLeft size={18} className={`transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-inface-muted hover:text-inface-text hover:bg-inface-border transition-colors">
            <Icon size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-inface-border">
          <p className="text-xs text-inface-muted">LeadForge v1.0</p>
        </div>
      )}
    </aside>
  );
}
```

**Step 2: Wire into `app/layout.tsx`**

```typescript
import { Sidebar } from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-inface-bg text-inface-text font-sans">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

**Step 3: Verify in browser**

```bash
npm run dev
# http://localhost:3000/dashboard — sidebar with Inface brand should appear
```

**Step 4: Commit**

```bash
git add dashboard/components/Sidebar.tsx dashboard/app/layout.tsx
git commit -m "feat: add Inface Sidebar layout"
```

---

### Task 3.3: KPI Stats Bar

**Files:**
- Create: `dashboard/components/StatsBar.tsx`

**Step 1: Write the component**

```typescript
// dashboard/components/StatsBar.tsx
// Requires Task 2.1 (backend stats endpoint) to return real data.
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { TrendingUp, Users, Activity, CheckCircle } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-inface-surface border border-inface-border rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-inface-muted text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-inface-text text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export function StatsBar() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.stats.summary().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="grid grid-cols-4 gap-4"><div className="col-span-4 h-20 animate-pulse bg-inface-surface rounded-xl" /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Leads"      value={stats.total_leads}                     icon={Users}       color="bg-inface-accent/10 text-inface-accent" />
      <StatCard label="Ready to Send"    value={stats.leads_by_status.ready ?? 0}      icon={CheckCircle} color="bg-green-500/10 text-green-400" />
      <StatCard label="Active Campaigns" value={stats.active_campaigns}                icon={Activity}    color="bg-yellow-500/10 text-yellow-400" />
      <StatCard label="Done Campaigns"   value={stats.done_campaigns}                  icon={TrendingUp}  color="bg-inface-accent/10 text-inface-accent" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/components/StatsBar.tsx
git commit -m "feat: add KPI StatsBar component"
```

---

### Task 3.4: Campaign Overview page

**Files:**
- Modify: `dashboard/app/dashboard/page.tsx`
- Audit: `dashboard/components/CampaignCard.tsx` (update prop types to use `lib/types.ts#Campaign` if they differ)

**Step 1: Update `dashboard/page.tsx`**

```typescript
// dashboard/app/dashboard/page.tsx
"use client";
import { useEffect } from "react";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import { CampaignCard } from "@/components/CampaignCard";
import { CampaignForm } from "@/components/CampaignForm";
import { StatsBar } from "@/components/StatsBar";

export default function DashboardPage() {
  const { campaigns, loading, fetch } = useCampaignStore();

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-inface-text">Dashboard</h1>
        <p className="text-inface-muted text-sm mt-1">Campaign and lead overview</p>
      </header>

      <StatsBar />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-inface-text">Campaigns</h2>
          <CampaignForm onCreated={fetch} />
        </div>
        {loading && <p className="text-inface-muted text-sm">Loading campaigns…</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => <CampaignCard key={c.id} campaign={c} onUpdate={fetch} />)}
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/app/dashboard/page.tsx dashboard/components/CampaignCard.tsx
git commit -m "feat: wire dashboard overview to Zustand campaign store"
```

---

### Task 3.5: Leads Data Grid page

**Files:**
- Create: `dashboard/app/dashboard/leads/page.tsx`
- Audit: `dashboard/components/LeadTable.tsx` (update prop types if needed)

**Step 1: Write `leads/page.tsx`**

```typescript
// dashboard/app/dashboard/leads/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useLeadStore } from "@/lib/stores/lead-store";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import { LeadTable } from "@/components/LeadTable";

export default function LeadsPage() {
  const { leads, loading, fetchAll, fetchByCampaign } = useLeadStore();
  const { campaigns, fetch: fetchCampaigns } = useCampaignStore();
  const [selectedCampaign, setSelectedCampaign] = useState("");

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaign) fetchByCampaign(selectedCampaign);
    else fetchAll();
  }, [selectedCampaign, fetchAll, fetchByCampaign]);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-inface-text">Leads</h1>
        <p className="text-inface-muted text-sm mt-1">{leads.length} leads</p>
      </header>

      <select
        value={selectedCampaign}
        onChange={(e) => setSelectedCampaign(e.target.value)}
        className="bg-inface-surface border border-inface-border text-inface-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-inface-accent"
      >
        <option value="">All campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>{c.niche} — {c.location}</option>
        ))}
      </select>

      {loading
        ? <p className="text-inface-muted text-sm">Loading leads…</p>
        : <LeadTable leads={leads} />}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/app/dashboard/leads/
git commit -m "feat: add Leads Data Grid page with campaign filter"
```

---

## Phase 4 — Refinement

### Task 4.1: Campaign status polling hook

**Files:**
- Create: `dashboard/hooks/useCampaignPoller.ts`

**Step 1: Write the hook**

```typescript
// dashboard/hooks/useCampaignPoller.ts
// Polls the campaign status endpoint every 5s for active campaigns.
// Stops polling automatically when campaign reaches a terminal state.
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import type { CampaignStatus } from "@/lib/types";

const ACTIVE: Set<CampaignStatus> = new Set(["pending", "scraping", "ai_running"]);
const POLL_MS = 5_000;

export function useCampaignPoller(campaignId: string, status: CampaignStatus) {
  const optimisticUpdate = useCampaignStore((s) => s.optimisticUpdate);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ACTIVE.has(status)) return;

    const poll = async () => {
      try {
        const data = await api.campaigns.status(campaignId);
        optimisticUpdate(campaignId, { status: data.status });
        if (!ACTIVE.has(data.status)) clearInterval(ref.current!);
      } catch (_) { /* next tick will retry */ }
    };

    ref.current = setInterval(poll, POLL_MS);
    return () => clearInterval(ref.current!);
  }, [campaignId, status, optimisticUpdate]);
}
```

**Step 2: Use in `CampaignCard.tsx`**

```typescript
import { useCampaignPoller } from "@/hooks/useCampaignPoller";
// Inside the component:
useCampaignPoller(campaign.id, campaign.status);
```

**Step 3: Commit**

```bash
git add dashboard/hooks/useCampaignPoller.ts dashboard/components/CampaignCard.tsx
git commit -m "feat: auto-poll active campaign status every 5s"
```

---

### Task 4.2: Error boundary

**Files:**
- Create: `dashboard/components/ErrorBoundary.tsx`

```typescript
// dashboard/components/ErrorBoundary.tsx
"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-inface-danger/30 bg-inface-danger/5 p-4">
          <p className="text-sm text-inface-danger">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Commit**

```bash
git add dashboard/components/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary for API fetch failures"
```

---

### Task 4.3: Dev proxy in `next.config.ts`

**Files:**
- Modify: `dashboard/next.config.ts`

```typescript
const nextConfig = {
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
    }];
  },
};
export default nextConfig;
```

**Step 2: Commit**

```bash
git add dashboard/next.config.ts
git commit -m "feat: add API rewrite proxy for local dev"
```

---

### Task 4.4: Final build verification

**Step 1: TypeScript check**

```bash
cd dashboard && npx tsc --noEmit
```
Expected: 0 errors

**Step 2: ESLint check**

```bash
npm run lint
```
Expected: 0 errors

**Step 3: Production build**

```bash
npm run build
```
Expected: Compiled successfully

**Step 4: Push everything**

```bash
git push origin main
```

---

## Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| D-1 | No LLM/AI on frontend | Edge AI calls | Explicitly forbidden in spec |
| D-2 | Zustand v5 (already installed) | React Query, SWR | Already in package.json; YAGNI |
| D-3 | Single `lib/api.ts` client | Per-component fetch | DRY — one place to add auth headers when needed |
| D-4 | Tailwind v3 (already installed) | Upgrade to v4 | v3 already installed; upgrade is a separate task |
| D-5 | One store per domain | Single god-store | SOLID — single responsibility per store |
| D-6 | Reuse existing components | Rewrite from scratch | 7 component files already exist — audit first |
| D-7 | 5s polling hook, not WebSocket | WebSocket, SSE | KISS — backend has no WS; polling is sufficient |
| D-8 | Stats endpoint in backend | Count in frontend | One DB query vs fetching all leads to count |

---

## Execution Checklist

- [ ] **Phase 1**: Setup — Tasks 1.1 through 1.5
- [ ] **Phase 2**: Backend endpoints — Tasks 2.1 and 2.2
- [ ] **Phase 3**: UI build — Tasks 3.1 through 3.5
- [ ] **Phase 4**: Refinement — Tasks 4.1 through 4.4
- [ ] Final: `npm run build` — zero type errors, zero ESLint errors
- [ ] Final: Push all commits to `origin main`
