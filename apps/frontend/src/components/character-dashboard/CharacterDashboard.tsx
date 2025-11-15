"use client";

import { useState, useEffect } from "react";
import { CharacterResponseDto } from "@/types/character";
import { calculateProficiencyBonus } from "./utils";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterTabs } from "./CharacterTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { DiceRadialMenu } from "../DiceRadialMenu";
import { SpellSlotTracker } from "../SpellSlotTracker";
import { Spellbook } from "../Spellbook";
import { Features } from "../Features";
import RollHistory from "../RollHistory";
import { eventApi } from "@/lib/api/event";

export interface CharacterDashboardProps {
  character: CharacterResponseDto;
  onUpdate: (updates: Partial<CharacterResponseDto>) => void;
}

type CharacterTab = "overview" | "spells" | "features" | "rolls";

export default function CharacterDashboard({
  character,
  onUpdate,
}: CharacterDashboardProps) {
  const [activeTab, setActiveTab] = useState<CharacterTab>("overview");
  const [localCharacter, setLocalCharacter] = useState(character);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [sseDisabled, setSseDisabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(
    null,
  );
  const [attemptHistory, setAttemptHistory] = useState<
    Array<{ timestamp: string; type: string; details: any }>
  >([]);

  useEffect(() => {
    setLocalCharacter(character);
    setSseDisabled(false); // Reset SSE disabled when character changes
    setIsPolling(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setLastEventTimestamp(null);
    setAttemptHistory([]);
  }, [character]);

  const pollEvents = async () => {
    try {
      const response = await eventApi.getCharacterEvents(localCharacter.id, {
        limit: 50, // Fetch recent events
        offset: 0,
      });
      const events = response.events;
      // Process events newer than lastEventTimestamp
      const newEvents = lastEventTimestamp
        ? events.filter(
            (event) => new Date(event.timestamp) > new Date(lastEventTimestamp),
          )
        : events;

      newEvents.forEach((event) => {
        handleEvent(event);
      });

      if (newEvents.length > 0) {
        const last = newEvents[newEvents.length - 1].timestamp;
        setLastEventTimestamp(
          typeof last === "string" ? last : new Date(last).toISOString(),
        );
      }
    } catch (error) {
      console.error("Failed to poll events:", error);
    }
  };

  useEffect(() => {
    if (sseDisabled && !isPolling) {
      // Start polling when SSE is disabled
      setIsPolling(true);
      const interval = setInterval(pollEvents, 10000); // Poll every 10 seconds
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }

    if (sseDisabled || isPolling) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 10;
    let retryDelay = 1000; // Start at 1 second
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3002";

    const connect = () => {
      const timestamp = new Date().toISOString();
      try {
        // Get JWT token from localStorage or wherever it's stored
        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");
        const url = token
          ? `${backendUrl}/events/character/${
              localCharacter.id
            }/stream?token=${encodeURIComponent(token)}`
          : `${backendUrl}/events/character/${localCharacter.id}/stream`;

        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          console.log(
            `[${timestamp}] EventSource connection opened successfully`,
          );
          retryCount = 0; // reset on success
          setAttemptHistory((prev) =>
            [
              ...prev,
              {
                timestamp,
                type: "connection_opened",
                details: { readyState: eventSource?.readyState },
              },
            ].slice(-20),
          ); // Keep last 20 attempts
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleEvent(data);
          } catch (error) {
            console.error(
              `[${new Date().toISOString()}] Failed to parse event:`,
              error,
            );
          }
        };

        eventSource.onerror = (event) => {
          const es = event.target as EventSource | null;

          const now = new Date().toISOString();

          const errorDetails = {
            type: event.type,
            readyState: es?.readyState,
            url: (es as any)?.url,
            retryCount,
          };

          console.error(`[${now}] EventSource connection error`, {
            rawEvent: event,
            ...errorDetails,
          });

          setAttemptHistory((prev) =>
            [
              ...prev,
              { timestamp, type: "connection_error", details: errorDetails },
            ].slice(-20),
          );

          if (eventSource) {
            eventSource.close();
          }
          if (retryCount < maxRetries) {
            retryCount++;
            const jitter = Math.random() * 0.1 * retryDelay;
            const delayWithJitter = retryDelay + jitter;
            retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff, cap at 30s

            console.log(
              `[${timestamp}] Retrying EventSource connection in ${delayWithJitter.toFixed(
                0,
              )}ms (attempt ${retryCount}/${maxRetries})`,
            );
            setTimeout(connect, delayWithJitter);
          } else {
            console.error(
              `[${timestamp}] Max retries (${maxRetries}) reached for EventSource connection. Switching to polling mode.`,
            );
            setSseDisabled(true);
            setIsPolling(true);
            const interval = setInterval(pollEvents, 10000); // Poll every 10 seconds
            setPollingInterval(interval);
          }
        };
      } catch (error) {
        const errorDetails = { error: (error as any).message || String(error) };
        console.error(
          `[${timestamp}] Failed to create EventSource:`,
          errorDetails,
        );

        setAttemptHistory((prev) =>
          [
            ...prev,
            { timestamp, type: "creation_error", details: errorDetails },
          ].slice(-20),
        );

        if (retryCount < maxRetries) {
          retryCount++;
          const jitter = Math.random() * 0.1 * retryDelay;
          const delayWithJitter = retryDelay + jitter;
          retryDelay = Math.min(retryDelay * 2, 30000);

          console.log(
            `[${timestamp}] Retrying EventSource creation in ${delayWithJitter.toFixed(
              0,
            )}ms (attempt ${retryCount}/${maxRetries})`,
          );
          setTimeout(connect, delayWithJitter);
        } else {
          console.error(
            `[${timestamp}] Max retries (${maxRetries}) reached for EventSource creation. Switching to polling mode.`,
          );
          setSseDisabled(true);
          setIsPolling(true);
          const interval = setInterval(pollEvents, 10000);
          setPollingInterval(interval);
        }
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [localCharacter.id, sseDisabled, isPolling]);

  const handleEvent = (event: any) => {
    const { type, payload } = event;
    let updates: Partial<CharacterResponseDto> = {};
    let eventMessage = "";

    switch (type) {
      case "LEVEL_UP":
        updates.level = payload.newLevel;
        eventMessage = `Leveled up to level ${payload.newLevel}`;
        break;
      case "EXPERIENCE_GAINED":
        updates.experiencePoints = payload.totalExperience;
        eventMessage = `Gained ${payload.experienceGained} experience points`;
        break;
      case "SKILL_PROFICIENCY_ADDED":
        // Update skillProficiencies
        const existingSkills = localCharacter.skillProficiencies || [];
        const skillIndex = existingSkills.findIndex(
          (s) => s.skill === payload.skill,
        );
        if (skillIndex >= 0) {
          existingSkills[skillIndex] = {
            ...existingSkills[skillIndex],
            proficient: payload.proficient,
            expertise: payload.expertise,
          };
        } else {
          existingSkills.push({
            id: payload.skill,
            skill: payload.skill,
            proficient: payload.proficient,
            expertise: payload.expertise,
          });
        }
        updates.skillProficiencies = existingSkills;
        eventMessage = `Added proficiency in ${payload.skill}`;
        break;
      case "DAMAGE_APPLIED":
        if (localCharacter.hitPoints) {
          updates.hitPoints = {
            ...localCharacter.hitPoints,
            current: Math.max(
              0,
              localCharacter.hitPoints.current - payload.damage,
            ),
          };
        }
        eventMessage = `Took ${payload.damage} damage`;
        break;
      case "HEALING_RECEIVED":
        if (localCharacter.hitPoints) {
          updates.hitPoints = {
            ...localCharacter.hitPoints,
            current: Math.min(
              localCharacter.hitPoints.max,
              localCharacter.hitPoints.current + payload.healing,
            ),
          };
        }
        eventMessage = `Received ${payload.healing} healing`;
        break;
      case "QUEST_FINISHED":
        updates.experiencePoints =
          (localCharacter.experiencePoints || 0) + payload.experienceReward;
        eventMessage = `Completed quest, gained ${payload.experienceReward} experience`;
        break;
      default:
        eventMessage = `${type} event occurred`;
    }

    if (Object.keys(updates).length > 0) {
      setLocalCharacter((prev) => ({ ...prev, ...updates }));
      onUpdate?.(updates);
    }

    setRecentEvents((prev) => [eventMessage, ...prev].slice(0, 10));
  };

  const proficiencyBonus = calculateProficiencyBonus(localCharacter.level);

  const handleManualReconnect = () => {
    setSseDisabled(false);
    setIsPolling(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setLastEventTimestamp(null);
    setAttemptHistory([]);
  };

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <CharacterHeader
        character={localCharacter}
        proficiencyBonus={proficiencyBonus}
      />

      {/* Connection Status Indicator */}
      {(sseDisabled || isPolling) && (
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {isPolling
                    ? "Using Polling Mode"
                    : "Real-time Updates Disabled"}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {isPolling
                      ? "Real-time updates are currently unavailable. The system is polling for updates every 10 seconds."
                      : "Failed to establish real-time connection after multiple attempts. Updates may be delayed."}
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-4">
              <button
                onClick={handleManualReconnect}
                className="px-3 py-2 text-sm font-medium text-yellow-800 transition-colors bg-yellow-100 rounded-md hover:bg-yellow-200"
              >
                Try Reconnect
              </button>
            </div>
          </div>
        </div>
      )}

      <CharacterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          character={localCharacter}
          proficiencyBonus={proficiencyBonus}
          onUpdate={onUpdate}
        />
      )}

      <DiceRadialMenu characterId={localCharacter.id} />
      {/* Spells */}
      {activeTab === "spells" && (
        <div className="space-y-6">
          <SpellSlotTracker
            character={localCharacter}
            onCharacterUpdate={onUpdate || (() => {})}
          />
          <Spellbook
            character={localCharacter}
            onCharacterUpdate={onUpdate || (() => {})}
          />
        </div>
      )}
      {/* Features */}
      {activeTab === "features" && (
        <Features
          character={localCharacter}
          onCharacterUpdate={onUpdate || (() => {})}
        />
      )}
      {/* Roll history */}
      {activeTab === "rolls" && <RollHistory characterId={localCharacter.id} />}
    </div>
  );
}
