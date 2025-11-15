"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign";
import { ApiError } from "@/lib/api/error-handler";
import { CampaignResponseDto } from "@/types/campaign";
import DMNoteEditor from "@/components/DMNoteEditor";
import DMZoneGraph from "@/components/DMZoneGraph";
import LocationManager from "@/components/LocationManager";
import DMRollHistory from "@/components/DMRollHistory";

export default function DMZonePage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
          DM Zone
        </h2>
        <div className="flex items-center space-x-4">
          <label
            htmlFor="campaign-select"
            className="text-sm font-medium text-amber-800 dark:text-amber-200"
          >
            Campaign:
          </label>
          <select
            id="campaign-select"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3 py-2 border rounded-lg border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCampaignId ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <LocationManager campaignId={selectedCampaignId} />
            <DMNoteEditor campaignId={selectedCampaignId} />
            <DMRollHistory />
          </div>
          <div className="h-96">
            <DMZoneGraph campaignId={selectedCampaignId} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-amber-700 dark:text-amber-300">
              Please select a campaign to access DM Zone features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
