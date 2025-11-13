"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacter } from "@/contexts/CharacterContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTheme } from "next-themes";
import CharacterList from "@/components/CharacterList";
import CharacterBuilder from "@/components/CharacterBuilder";
import CharacterDashboard from "@/components/CharacterDashboard";
import { CharacterResponseDto } from "@/types/character";
import DMNoteEditor from "@/components/DMNoteEditor";
import DMZoneGraph from "@/components/DMZoneGraph";
import LocationManager from "@/components/LocationManager";
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
import InventoryDisplay from "@/components/InventoryDisplay";
import SessionLog from "@/components/SessionLog";
import DMRollHistory from "@/components/DMRollHistory";

type Module =
  | "characters"
  | "campaigns"
  | "dice"
  | "dm-zone"
  | "generator"
  | "inventory"
  | "quests"
  | "sessions"
  | "spells";
type CharacterView = "list" | "create" | "view";
type CampaignView = "list" | "view";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { selectedCharacter, setSelectedCharacter } = useCharacter();
  const [activeModule, setActiveModule] = useState<Module>("characters");
  const [characterView, setCharacterView] = useState<CharacterView>("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleCharacterSelect = (character: CharacterResponseDto) => {
    setSelectedCharacter(character);
    setCharacterView("view");
  };

  const handleCreateCharacter = () => {
    setCharacterView("create");
  };

  const handleCharacterCreated = (character: any) => {
    setCharacterView("list");
    // Could refresh the list here
  };

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
      // Could show a toast notification here
      alert(`Failed to load campaign data: ${apiError.message}`);
    }
  };

  const handleCreateCampaign = () => {
    // For now, just show a placeholder
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
    // Refresh quests
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
        // Could show a toast notification here
        alert(`Failed to load campaigns: ${apiError.message}`);
      }
    };

    loadCampaigns();
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case "characters":
        if (characterView === "create") {
          return (
            <div>
              <button
                onClick={() => setCharacterView("list")}
                className="px-4 py-2 mb-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Characters
              </button>
              <CharacterBuilder onComplete={handleCharacterCreated} />
            </div>
          );
        } else if (characterView === "view" && selectedCharacter) {
          return (
            <div>
              <button
                onClick={() => setCharacterView("list")}
                className="px-4 py-2 mb-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Characters
              </button>
              <CharacterDashboard character={selectedCharacter} />
            </div>
          );
        } else {
          return (
            <CharacterList
              onCharacterSelect={handleCharacterSelect}
              onCreateCharacter={handleCreateCharacter}
            />
          );
        }
      case "campaigns":
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
                className="px-4 py-2 mb-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Campaigns
              </button>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {selectedCampaign.name}
                    </h2>
                    {selectedCampaign.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {selectedCampaign.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCreateQuest}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Manage Quests
                  </button>
                </div>

                {/* Quest Form */}
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

                {/* Campaign Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                              {campaignSessions.length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress and Activity */}
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Campaigns
                </h2>
                <button
                  onClick={handleCreateCampaign}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>

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
                    <button
                      onClick={handleCreateCampaign}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                        <div className="mt-4">
                          <button
                            onClick={() => handleCampaignSelect(campaign)}
                            className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
      case "dice":
        if (selectedCharacter) {
          setActiveModule("characters"); // Switch back to characters - dice menu is always visible
          return null;
        } else {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  Dice Roller
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please select a character from the Characters module first.
                </p>
              </div>
            </div>
          );
        }
      case "dm-zone":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                DM Zone
              </h2>
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="campaign-select"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Campaign:
                </label>
                <select
                  id="campaign-select"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  <p className="text-gray-600 dark:text-gray-400">
                    Please select a campaign to access DM Zone features.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case "generator":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Generator Module
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Coming soon...</p>
            </div>
          </div>
        );
      case "inventory":
        if (selectedCharacter) {
          return <InventoryDisplay characterId={selectedCharacter.id} />;
        } else {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  Inventory Module
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please select a character from the Characters module first.
                </p>
              </div>
            </div>
          );
        }
      case "quests":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Quests Module
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Coming soon...</p>
            </div>
          </div>
        );
      case "sessions":
        if (selectedCampaignId) {
          return <SessionLog campaignId={selectedCampaignId} />;
        } else {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  Sessions Module
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please select a campaign from the Campaigns module first.
                </p>
              </div>
            </div>
          );
        }
      case "spells":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Spells Module
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } md:flex fixed md:relative z-50 md:z-auto`}
          activeModule={activeModule}
          onModuleChange={(module) => {
            setActiveModule(module as Module);
            setCharacterView("list");
            setCampaignView("list");
            setSidebarOpen(false); // Close on mobile
          }}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="bg-white shadow dark:bg-gray-800">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-6">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 mr-4 text-gray-500 md:hidden hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ☰
                  </button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    D&D Companion Dashboard
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {user?.username}!
                  </span>
                  <button
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {theme === "dark" ? "☀️" : "🌙"}
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Module Content */}
          <main className="flex-1 p-6">
            <ErrorBoundary>{renderModuleContent()}</ErrorBoundary>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
