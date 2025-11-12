"use client";

import { useState, useEffect } from "react";
import { eventApi } from "@/lib/api/event";
import { EventResponseDto, EventsResponseDto } from "@/types/event";

interface EventFeedProps {
  campaignId?: string;
  sessionId?: string;
  characterId?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function EventFeed({
  campaignId,
  sessionId,
  characterId,
  limit = 20,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: EventFeedProps) {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchEvents = async () => {
    try {
      let eventsData: EventsResponseDto;

      if (sessionId) {
        eventsData = await eventApi.getSessionEvents(sessionId, { limit });
      } else if (characterId) {
        eventsData = await eventApi.getCharacterEvents(characterId, { limit });
      } else {
        const query: any = { limit };
        if (sessionId) query.sessionId = sessionId;
        if (characterId) query.actorId = characterId;
        eventsData = await eventApi.getEvents(query);
      }

      setEvents(eventsData.events);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to load events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [campaignId, sessionId, characterId, limit]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchEvents, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "QUEST_STARTED":
      case "QUEST_COMPLETED":
        return "🎯";
      case "COMBAT_STARTED":
      case "COMBAT_ENDED":
        return "⚔️";
      case "ITEM_GRANTED":
        return "🎁";
      case "HP_CHANGED":
        return "❤️";
      case "SPELL_CAST":
        return "✨";
      default:
        return "📝";
    }
  };

  const formatEventDescription = (event: EventResponseDto) => {
    const { type, payload } = event;

    switch (type) {
      case "QUEST_STARTED":
        return `Quest "${payload?.questName || "Unknown"}" started`;
      case "QUEST_COMPLETED":
        return `Quest "${payload?.questName || "Unknown"}" completed`;
      case "COMBAT_STARTED":
        return "Combat encounter began";
      case "COMBAT_ENDED":
        return `Combat ended - ${payload?.result || "Unknown result"}`;
      case "ITEM_GRANTED":
        return `${payload?.characterName || "Character"} received ${
          payload?.itemName || "an item"
        }`;
      case "HP_CHANGED":
        const change = payload?.change || 0;
        const action = change > 0 ? "gained" : "lost";
        return `${payload?.characterName || "Character"} ${action} ${Math.abs(
          change,
        )} HP`;
      case "SPELL_CAST":
        return `${payload?.characterName || "Character"} cast ${
          payload?.spellName || "a spell"
        }`;
      default:
        return type.replace(/_/g, " ").toLowerCase();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading events...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Event Feed
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchEvents}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-96">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-4xl text-gray-400">📭</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No events to display
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-start p-3 space-x-3 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="text-lg shrink-0">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatEventDescription(event)}
                    </p>
                    <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {event.sessionId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                        Session
                      </span>
                    )}
                    {event.actorId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-2">
                        Actor: {event.actorId.slice(0, 8)}...
                      </span>
                    )}
                    {event.targetId && event.targetId !== event.actorId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Target: {event.targetId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {autoRefresh && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Auto-refreshing every {refreshInterval / 1000} seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
