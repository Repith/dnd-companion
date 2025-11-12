"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { questApi } from "@/lib/api/quest";
import {
  QuestResponseDto,
  CreateQuestDto,
  UpdateQuestDto,
} from "@/types/quest";

const questSchema = z.object({
  name: z.string().min(1, "Quest name is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  experienceReward: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type QuestFormData = z.infer<typeof questSchema>;

interface QuestFormProps {
  campaignId: string;
  quest?: QuestResponseDto | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuestForm({
  campaignId,
  quest,
  onSuccess,
  onCancel,
}: QuestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: quest
      ? {
          name: quest.name,
          summary: quest.summary || "",
          description: quest.description || "",
          experienceReward: quest.experienceReward || 0,
          notes: quest.notes || "",
        }
      : {
          name: "",
          summary: "",
          description: "",
          experienceReward: 0,
          notes: "",
        },
  });

  const onSubmit = async (data: QuestFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Clean the data by removing undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== undefined && value !== "",
        ),
      );

      if (quest) {
        // Update existing quest
        await questApi.update(quest.id, cleanData as unknown as UpdateQuestDto);
      } else {
        // Create new quest
        await questApi.create(
          campaignId,
          cleanData as unknown as CreateQuestDto,
        );
      }

      onSuccess();
      if (!quest) {
        reset();
      }
    } catch (err) {
      setError(quest ? "Failed to update quest" : "Failed to create quest");
      console.error("Quest form error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          {quest ? "Edit Quest" : "Create New Quest"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quest Name *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Enter quest name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Summary
            </label>
            <input
              {...register("summary")}
              type="text"
              id="summary"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Brief summary of the quest"
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.summary.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              {...register("description")}
              id="description"
              rows={4}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Detailed description of the quest"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="experienceReward"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Experience Reward
            </label>
            <input
              {...register("experienceReward", { valueAsNumber: true })}
              type="number"
              id="experienceReward"
              min="0"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="0"
            />
            {errors.experienceReward && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.experienceReward.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              DM Notes
            </label>
            <textarea
              {...register("notes")}
              id="notes"
              rows={3}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Private notes for the DM"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.notes.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/50">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? quest
                  ? "Updating..."
                  : "Creating..."
                : quest
                ? "Update Quest"
                : "Create Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
