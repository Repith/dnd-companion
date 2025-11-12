"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { questApi } from "@/lib/api/quest";
import { campaignApi } from "@/lib/api/campaign";
import { QuestResponseDto, QuestStatus } from "@/types/quest";
import { CampaignResponseDto } from "@/types/campaign";
import Link from "next/link";
import QuestForm from "@/components/QuestForm";

const statusColors = {
  [QuestStatus.NOT_STARTED]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  [QuestStatus.IN_PROGRESS]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [QuestStatus.COMPLETED]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [QuestStatus.FAILED]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  [QuestStatus.NOT_STARTED]: "Not Started",
  [QuestStatus.IN_PROGRESS]: "In Progress",
  [QuestStatus.COMPLETED]: "Completed",
  [QuestStatus.FAILED]: "Failed",
};

export default function CampaignQuestsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CampaignResponseDto | null>(null);
  const [quests, setQuests] = useState<QuestResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QuestStatus | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestResponseDto | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== "string") return;

      try {
        const [campaignData, questsData] = await Promise.all([
          campaignApi.getById(id),
          questApi.getAll(id),
        ]);

        setCampaign(campaignData);
        setQuests(questsData);
      } catch (err) {
        setError("Failed to load quest data");
        console.error("Error fetching quest data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const filteredQuests =
    filter === "ALL"
      ? quests
      : quests.filter((quest) => quest.status === filter);

  const handleStatusUpdate = async (
    questId: string,
    newStatus: QuestStatus,
  ) => {
    try {
      await questApi.updateProgress(questId, {
        characterId: user?.id || "",
        status: newStatus,
      });

      // Refresh quests
      if (id && typeof id === "string") {
        const updatedQuests = await questApi.getAll(id);
        setQuests(updatedQuests);
      }
    } catch (err) {
      console.error("Error updating quest status:", err);
    }
  };

  const handleAwardRewards = async (questId: string) => {
    try {
      await questApi.awardRewards(questId);
      // Refresh quests
      if (id && typeof id === "string") {
        const updatedQuests = await questApi.getAll(id);
        setQuests(updatedQuests);
      }
    } catch (err) {
      console.error("Error awarding rewards:", err);
    }
  };

  const handleCreateQuest = () => {
    setEditingQuest(null);
    setShowForm(true);
  };

  const handleEditQuest = (quest: QuestResponseDto) => {
    setEditingQuest(quest);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingQuest(null);
    // Refresh quests
    if (id && typeof id === "string") {
      const updatedQuests = await questApi.getAll(id);
      setQuests(updatedQuests);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingQuest(null);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading quests...</div>
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.name} - Quests
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage and track quest progress
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/campaigns/${campaign.id}` as any}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Back to Campaign
                </Link>
                <button
                  onClick={handleCreateQuest}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Quest
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Quest Form */}
            {showForm && (
              <div className="mb-6">
                <QuestForm
                  campaignId={campaign.id}
                  quest={editingQuest || null}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            )}

            {/* Filter Controls */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === "ALL"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  All ({quests.length})
                </button>
                {Object.values(QuestStatus).map((status) => {
                  const count = quests.filter(
                    (q) => q.status === status,
                  ).length;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        filter === status
                          ? statusColors[status]
                              .replace("bg-", "bg-")
                              .replace("text-", "text-")
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {statusLabels[status]} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quests List */}
            {filteredQuests.length === 0 ? (
              <div className="flex items-center justify-center border-4 border-gray-200 border-dashed rounded-lg dark:border-gray-700 h-96">
                <div className="text-center">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                    No quests found
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    {filter === "ALL"
                      ? "Create your first quest to get started."
                      : `No quests with status "${
                          statusLabels[filter as QuestStatus]
                        }".`}
                  </p>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Create Quest
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-white rounded-lg shadow dark:bg-gray-800"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {quest.name}
                          </h3>
                          {quest.summary && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {quest.summary}
                            </p>
                          )}
                          <div className="flex items-center mt-2 space-x-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[quest.status]
                              }`}
                            >
                              {statusLabels[quest.status]}
                            </span>
                            {quest.experienceReward > 0 && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                XP: {quest.experienceReward}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {quest.status === QuestStatus.IN_PROGRESS && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  quest.id,
                                  QuestStatus.COMPLETED,
                                )
                              }
                              className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          {quest.status === QuestStatus.COMPLETED && (
                            <button
                              onClick={() => handleAwardRewards(quest.id)}
                              className="px-3 py-1 text-sm text-white bg-purple-600 rounded hover:bg-purple-700"
                            >
                              Award Rewards
                            </button>
                          )}
                          <button
                            onClick={() => handleEditQuest(quest)}
                            className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      {quest.description && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {quest.description}
                          </p>
                        </div>
                      )}
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
