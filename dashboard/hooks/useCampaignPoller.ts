import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import type { CampaignStatus, CampaignStatusResponse } from "@/lib/types";

const ACTIVE: Set<CampaignStatus> = new Set(["pending", "scraping", "ai_running"]);
const POLL_MS = 5_000;

export function useCampaignPoller(campaignId: string, status: CampaignStatus) {
  const optimisticUpdate = useCampaignStore((s) => s.optimisticUpdate);
  const [liveStatus, setLiveStatus] = useState<CampaignStatusResponse | null>(null);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    api.campaigns.status(campaignId).then((data) => {
      if (mounted) setLiveStatus(data);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [campaignId]);

  useEffect(() => {
    if (!ACTIVE.has(status)) return;

    const poll = async () => {
      try {
        const data = await api.campaigns.status(campaignId);
        setLiveStatus(data);
        optimisticUpdate(campaignId, { status: data.status });
        if (!ACTIVE.has(data.status)) clearInterval(ref.current!);
      } catch {
        // silent fail
      }
    };

    ref.current = setInterval(poll, POLL_MS);
    return () => clearInterval(ref.current!);
  }, [campaignId, status, optimisticUpdate]);

  return { liveStatus, setLiveStatus };
}
