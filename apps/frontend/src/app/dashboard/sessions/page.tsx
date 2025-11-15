"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign";
import { ApiError } from "@/lib/api/error-handler";
import { CampaignResponseDto } from "@/types/campaign";
import SessionLog from "@/components/SessionLog";

export default function SessionsPage() {
  const [campaigns, setCampaigns] = useState<CampaignResponseDto[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsData = await campaignApi.getAll();
        setCampaigns(campaignsData);
        if (campaignsData.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(campaignsData[0].id);
        }
      } catch (error) {
        const apiError = error as ApiError;
        console.error("Error loading campaigns:", apiError);
        alert(`Failed to load campaigns: ${apiError.message}`);
      }
    };

    loadCampaigns();
  }, []);

  if (selectedCampaignId) {
    return <SessionLog campaignId={selectedCampaignId} />;
  } else {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-amber-900 dark:text-amber-100">
            Sessions Module
          </h2>
          <p className="text-amber-700 dark:text-amber-300">
            Please select a campaign from the Campaigns module first.
          </p>
        </div>
      </div>
    );
  }
}
