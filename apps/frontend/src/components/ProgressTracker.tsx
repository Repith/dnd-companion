"use client";

import { useState, useEffect } from "react";
import { questApi } from "@/lib/api/quest";
import { QuestResponseDto, QuestStatus } from "@/types/quest";

interface ProgressTrackerProps {
  campaignId: string;
}

export default function ProgressTracker({ campaignId }: ProgressTrackerProps) {
  const [quests, setQuests] = useState<QuestResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const questsData = await questApi.getAll(campaignId);
        setQuests(questsData);
      } catch (err) {
        console.error("Error fetching quests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading progress...</div>
          </div>
        </div>
      </div>
    );
  }

  const totalQuests = quests.length;
  const completedQuests = quests.filter(
    (q) => q.status === QuestStatus.COMPLETED,
  ).length;
  const inProgressQuests = quests.filter(
    (q) => q.status === QuestStatus.IN_PROGRESS,
  ).length;
  const failedQuests = quests.filter(
    (q) => q.status === QuestStatus.FAILED,
  ).length;

  const completionPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  const totalExperienceReward = quests
    .filter((q) => q.status === QuestStatus.COMPLETED)
    .reduce((sum, quest) => sum + quest.experienceReward, 0);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Campaign Progress
        </h3>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Completion
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedQuests} of {totalQuests} quests
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                completionPercentage,
              )}`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="mt-1 text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completionPercentage.toFixed(1)}% complete
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedQuests}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {inProgressQuests}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              In Progress
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {totalQuests - completedQuests - inProgressQuests - failedQuests}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Not Started
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {failedQuests}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Failed
            </div>
          </div>
        </div>

        {/* Experience Gained */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Experience Gained
            </span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {totalExperienceReward} XP
            </span>
          </div>
        </div>

        {/* Quest Milestones */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Quest Milestones
          </h4>
          <div className="space-y-2">
            {totalQuests === 0 && (
              <div className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                No quests yet
              </div>
            )}
            {quests.slice(0, 5).map((quest) => (
              <div
                key={quest.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700 truncate dark:text-gray-300">
                  {quest.name}
                </span>
                <div className="flex items-center space-x-2">
                  {quest.experienceReward > 0 && (
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      +{quest.experienceReward} XP
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      quest.status === QuestStatus.COMPLETED
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : quest.status === QuestStatus.IN_PROGRESS
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : quest.status === QuestStatus.FAILED
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {quest.status === QuestStatus.COMPLETED
                      ? "✓"
                      : quest.status === QuestStatus.IN_PROGRESS
                      ? "⟳"
                      : quest.status === QuestStatus.FAILED
                      ? "✗"
                      : "○"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
