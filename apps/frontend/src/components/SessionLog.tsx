"use client";

import { useState, useEffect } from "react";
import { sessionApi } from "@/lib/api/session";
import { eventApi } from "@/lib/api/event";
import { SessionResponseDto } from "@/types/session";
import { EventResponseDto } from "@/types/event";

interface SessionLogProps {
  campaignId: string;
}

export default function SessionLog({ campaignId }: SessionLogProps) {
  const [sessions, setSessions] = useState<SessionResponseDto[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<SessionResponseDto | null>(null);
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await sessionApi.getAll(campaignId);
        setSessions(sessionsData);
        if (sessionsData.length > 0) {
          setSelectedSession(sessionsData[0]);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [campaignId]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedSession) return;

      try {
        const eventsData = await sessionApi.getEvents(selectedSession.id);
        setEvents(eventsData);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, [selectedSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading session log...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Session Log
        </h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Sessions
            </h4>
            <div className="space-y-2 overflow-y-auto max-h-96">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedSession?.id === session.id
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="font-medium">
                    {new Date(session.date).toLocaleDateString()}
                  </div>
                  {session.notes && (
                    <div className="text-xs text-gray-500 truncate dark:text-gray-400">
                      {session.notes}
                    </div>
                  )}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                  No sessions yet
                </div>
              )}
            </div>
          </div>

          {/* Events Feed */}
          <div className="lg:col-span-2">
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              {selectedSession
                ? `Events - ${new Date(
                    selectedSession.date,
                  ).toLocaleDateString()}`
                : "Select a session"}
            </h4>
            <div className="space-y-3 overflow-y-auto max-h-96">
              {selectedSession ? (
                events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start p-3 space-x-3 rounded-md bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="shrink-0">
                        <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {event.payload &&
                          typeof event.payload === "object" ? (
                            <pre className="p-2 overflow-x-auto text-xs bg-gray-100 rounded dark:bg-gray-800">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          ) : (
                            <span>{String(event.payload || "No details")}</span>
                          )}
                        </div>
                        {(event.actorId || event.targetId) && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {event.actorId && `Actor: ${event.actorId}`}
                            {event.actorId && event.targetId && " • "}
                            {event.targetId && `Target: ${event.targetId}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                    No events recorded for this session
                  </div>
                )
              ) : (
                <div className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                  Select a session to view events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
