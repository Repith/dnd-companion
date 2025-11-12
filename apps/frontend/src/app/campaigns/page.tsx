"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { campaignApi } from "@/lib/api/campaign";
import { CampaignResponseDto } from "@/types/campaign";
import Link from "next/link";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await campaignApi.getAll();
        setCampaigns(data);
      } catch (err) {
        setError("Failed to load campaigns");
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading campaigns...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-600">{error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Campaigns
              </h1>
              <Link
                href={"/campaigns/create" as any}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Campaign
              </Link>
            </div>
          </div>
        </header>

        <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {campaigns.length === 0 ? (
              <div className="flex items-center justify-center border-4 border-gray-200 border-dashed rounded-lg dark:border-gray-700 h-96">
                <div className="text-center">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                    No campaigns yet
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Create your first campaign to get started with your D&D
                    adventures.
                  </p>
                  <Link
                    href={"/campaigns/create" as any}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Create Campaign
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {campaign.name}
                      </h3>
                      {campaign.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.description}
                        </p>
                      )}
                      <div className="mt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Players: {campaign.playerIds.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Quests: {campaign.questIds.length}
                        </div>
                      </div>
                      <div className="flex mt-4 space-x-2">
                        <Link
                          href={`/campaigns/${campaign.id}` as any}
                          className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          View
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}/quests` as any}
                          className="flex-1 px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          Quests
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
