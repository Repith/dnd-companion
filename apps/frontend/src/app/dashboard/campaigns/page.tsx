"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/api/campaign";
import { questApi } from "@/lib/api/quest";
import { sessionApi } from "@/lib/api/session";
import { ApiError } from "@/lib/api/error-handler";
import { CampaignResponseDto } from "@/types/campaign";
import { QuestResponseDto } from "@/types/quest";
import { SessionResponseDto } from "@/types/session";
import ProgressTracker from "@/components/ProgressTracker";
import EventFeed from "@/components/EventFeed";
import QuestForm from "@/components/QuestForm";

type CampaignView = "list" | "view";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignResponseDto[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [campaignView, setCampaignView] = useState<CampaignView>("list");
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignResponseDto | null>(null);
  const [campaignQuests, setCampaignQuests] = useState<QuestResponseDto[]>([]);
  const [campaignSessions, setCampaignSessions] = useState<
    SessionResponseDto[]
  >([]);
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestResponseDto | null>(
    null,
  );

  const handleCampaignSelect = async (campaign: CampaignResponseDto) => {
    setSelectedCampaign(campaign);
    setSelectedCampaignId(campaign.id);
    setCampaignView("view");

    try {
      const [questsData, sessionsData] = await Promise.all([
        questApi.getAll(campaign.id),
        sessionApi.getAll(campaign.id),
      ]);
      setCampaignQuests(questsData);
      setCampaignSessions(sessionsData);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error loading campaign data:", apiError);
      alert(`Failed to load campaign data: ${apiError.message}`);
    }
  };

  const handleCreateCampaign = () => {
    console.log("Create campaign clicked");
  };

  const handleCreateQuest = () => {
    setEditingQuest(null);
    setShowQuestForm(true);
  };

  const handleEditQuest = (quest: QuestResponseDto) => {
    setEditingQuest(quest);
    setShowQuestForm(true);
  };

  const handleQuestFormSuccess = async () => {
    setShowQuestForm(false);
    setEditingQuest(null);
    if (selectedCampaign) {
      try {
        const updatedQuests = await questApi.getAll(selectedCampaign.id);
        setCampaignQuests(updatedQuests);
      } catch (error) {
        console.error("Error refreshing quests:", error);
      }
    }
  };

  const handleQuestFormCancel = () => {
    setShowQuestForm(false);
    setEditingQuest(null);
  };

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

  if (campaignView === "view" && selectedCampaign) {
    const activeQuests = campaignQuests.filter(
      (q) => q.status === "IN_PROGRESS",
    );
    const completedQuests = campaignQuests.filter(
      (q) => q.status === "COMPLETED",
    );

    return (
      <div>
        <button
          onClick={() => setCampaignView("list")}
          className="px-4 py-2 mb-4 text-sm font-medium bg-white border rounded-lg text-amber-800 border-amber-300 hover:bg-amber-50 dark:bg-gray-800 dark:border-gray-600 dark:text-amber-200 dark:hover:bg-gray-700"
        >
          ← Back to Campaigns
        </button>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                {selectedCampaign.name}
              </h2>
              {selectedCampaign.description && (
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {selectedCampaign.description}
                </p>
              )}
            </div>
            <button
              onClick={handleCreateQuest}
              className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-amber-600 hover:bg-amber-700"
            >
              Manage Quests
            </button>
          </div>

          {showQuestForm && (
            <div className="mt-6">
              <QuestForm
                campaignId={selectedCampaign.id}
                quest={editingQuest || null}
                onSuccess={handleQuestFormSuccess}
                onCancel={handleQuestFormCancel}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500">
                      <span className="text-sm font-medium text-white">P</span>
                    </div>
                  </div>
                  <div className="flex-1 w-0 ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                        Players
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedCampaign.playerIds.length}
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
                      <span className="text-sm font-medium text-white">Q</span>
                    </div>
                  </div>
                  <div className="flex-1 w-0 ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                        Total Quests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {campaignQuests.length}
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
                      <span className="text-sm font-medium text-white">A</span>
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
                      <span className="text-sm font-medium text-white">S</span>
                    </div>
                  </div>
                  <div className="flex-1 w-0 ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                        Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {campaignSessions.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProgressTracker campaignId={selectedCampaign.id} />
            <EventFeed campaignId={selectedCampaign.id} limit={10} />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
            Campaigns
          </h2>
          <button
            onClick={handleCreateCampaign}
            className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-amber-600 hover:bg-amber-700"
          >
            Create Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex items-center justify-center border-4 border-dashed rounded-lg border-amber-200 dark:border-amber-800 h-96">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-amber-900 dark:text-amber-100">
                No campaigns yet
              </h2>
              <p className="mb-4 text-amber-700 dark:text-amber-300">
                Create your first campaign to get started with your D&D
                adventures.
              </p>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-amber-600 hover:bg-amber-700"
              >
                Create Campaign
              </button>
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
                  <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100">
                    {campaign.name}
                  </h3>
                  {campaign.description && (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      {campaign.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      Players: {campaign.playerIds.length}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      Quests: {campaign.questIds.length}
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => handleCampaignSelect(campaign)}
                      className="w-full px-3 py-2 text-sm font-medium text-center text-white transition-colors rounded-lg bg-amber-600 hover:bg-amber-700"
                    >
                      View Campaign
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
