"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { campaignApi } from "@/lib/api/campaign";
import { questApi } from "@/lib/api/quest";
import { sessionApi } from "@/lib/api/session";
import { CampaignResponseDto } from "@/types/campaign";
import { QuestResponseDto } from "@/types/quest";
import { SessionResponseDto } from "@/types/session";
import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import EventFeed from "@/components/EventFeed";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CampaignResponseDto | null>(null);
  const [quests, setQuests] = useState<QuestResponseDto[]>([]);
  const [sessions, setSessions] = useState<SessionResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!id || typeof id !== "string") return;

      try {
        const [campaignData, questsData, sessionsData] = await Promise.all([
          campaignApi.getById(id),
          questApi.getAll(id),
          sessionApi.getAll(id),
        ]);

        setCampaign(campaignData);
        setQuests(questsData);
        setSessions(sessionsData);
      } catch (err) {
        setError("Failed to load campaign data");
        console.error("Error fetching campaign data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading campaign...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !campaign) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-600">{error || "Campaign not found"}</div>
        </div>
      </ProtectedRoute>
    );
  }

  const activeQuests = quests.filter((q) => q.status === "IN_PROGRESS");
  const completedQuests = quests.filter((q) => q.status === "COMPLETED");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.name}
                </h1>
                {campaign.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {campaign.description}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/campaigns/${campaign.id}/quests` as any}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Manage Quests
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/sessions` as any}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Sessions
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Campaign Stats */}
            <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-md">
                        <span className="text-sm font-medium text-white">
                          P
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-0 ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                          Players
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {campaign.playerIds.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-md">
                        <span className="text-sm font-medium text-white">
                          Q
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-0 ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                          Total Quests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {quests.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 rounded-md">
                        <span className="text-sm font-medium text-white">
                          A
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-0 ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                          Active Quests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {activeQuests.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-md">
                        <span className="text-sm font-medium text-white">
                          S
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-0 ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                          Sessions
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {sessions.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress and Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProgressTracker campaignId={campaign.id} />
              <EventFeed campaignId={campaign.id} limit={10} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
