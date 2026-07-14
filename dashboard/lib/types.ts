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

export type CampaignStatusResponse = CampaignStatusPoll;

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
