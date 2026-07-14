// dashboard/lib/api.ts
// ALL backend communication goes through this module.

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

export const listCampaigns = () => request<Campaign[]>("/api/v1/campaigns/");
export const getCampaignStatus = (id: string) => request<CampaignStatusPoll>(`/api/v1/campaigns/${id}/status`);
export const createCampaign = (payload: { niche: string; location: string; language: string }) =>
  request<Campaign>("/api/v1/campaigns/", { method: "POST", body: JSON.stringify(payload) });
export const cancelCampaign = (id: string) =>
  request<Campaign>(`/api/v1/campaigns/${id}/cancel`, { method: "POST" });
export const retryCampaign = (id: string) =>
  request<Campaign>(`/api/v1/campaigns/${id}/retry`, { method: "POST" });
export const deleteCampaign = (id: string) =>
  request<void>(`/api/v1/campaigns/${id}`, { method: "DELETE" });

export const listLeads = (campaignId?: string, status?: string) => {
  const params: Record<string, string> = {};
  if (campaignId) params.campaign_id = campaignId;
  if (status) params.status = status;
  const qs = new URLSearchParams(params).toString();
  return request<Lead[]>(`/api/v1/leads/${qs ? `?${qs}` : ""}`);
};
export const getLead = (id: string) => request<Lead>(`/api/v1/leads/${id}`);
export const updateLeadStatus = (id: string, new_status: string) =>
  request<Lead>(`/api/v1/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ new_status }),
  });
export const updateLead = (id: string, patch: Partial<Lead>) =>
  request<Lead>(`/api/v1/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
export const triggerAIPipeline = (id: string) =>
  request<void>(`/api/v1/leads/${id}/trigger-ai`, { method: "POST" });

export const getPreviewUrl = (slug: string, lang: 'en' | 'ar') =>
  `${BASE}/api/v1/preview/${slug}?lang=${lang}`;

export const getDashboardStats = () => request<DashboardStats>("/api/v1/stats/summary");

export const api = {
  campaigns: {
    list: listCampaigns,
    get: getCampaignStatus, // actually should be get campaign, but we don't have that endpoint
    status: getCampaignStatus,
    create: createCampaign,
    cancel: cancelCampaign,
    retry: retryCampaign,
    delete: deleteCampaign,
  },
  leads: {
    list: listLeads,
    get: getLead,
    updateStatus: updateLeadStatus,
    update: updateLead,
  },
  stats: {
    summary: getDashboardStats,
  },
};
