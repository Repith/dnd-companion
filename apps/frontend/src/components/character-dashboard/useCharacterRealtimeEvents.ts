"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { eventApi } from "@/lib/api/event";
import type { CharacterEvent } from "@/contexts/CharacterEventBus";

interface UseCharacterRealtimeEventsOptions {
  characterId: string;
  publishEvent: (event: CharacterEvent) => Promise<void> | void;
}

export function useCharacterRealtimeEvents({
  characterId,
  publishEvent,
}: UseCharacterRealtimeEventsOptions) {
  const [sseDisabled, setSseDisabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(
    null,
  );
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollEvents = useCallback(async () => {
    try {
      const response = await eventApi.getCharacterEvents(characterId, {
        limit: 50,
        offset: 0,
      });
      const events = response.events as CharacterEvent[];

      const newEvents = lastEventTimestamp
        ? events.filter(
            (event: any) =>
              new Date(event.timestamp) > new Date(lastEventTimestamp),
          )
        : events;

      for (const event of newEvents) {
        await publishEvent({
          ...event,
          timestamp:
            typeof event.timestamp === "string"
              ? new Date(event.timestamp)
              : event.timestamp ?? new Date(),
        } as CharacterEvent);
      }

      if (newEvents.length > 0) {
        const last = newEvents[newEvents.length - 1].timestamp;
        setLastEventTimestamp(
          typeof last === "string" ? last : new Date(last).toISOString(),
        );
      }
    } catch (error) {
      console.error("Failed to poll events:", error);
    }
  }, [characterId, lastEventTimestamp, publishEvent]);

  // zarządzanie interwałem pollingu
  useEffect(() => {
    if (!isPolling) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(pollEvents, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, pollEvents]);

  // reset przy zmianie postaci
  useEffect(() => {
    setSseDisabled(false);
    setIsPolling(false);
    setLastEventTimestamp(null);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [characterId]);

  // SSE
  useEffect(() => {
    if (sseDisabled) return;

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3002";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") || localStorage.getItem("token")
        : null;

    const url = token
      ? `${backendUrl}/events/character/${characterId}/stream?token=${encodeURIComponent(
          token,
        )}`
      : `${backendUrl}/events/character/${characterId}/stream`;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(url);

      eventSource.onmessage = async (ev) => {
        try {
          const data = JSON.parse(ev.data);
          await publishEvent({
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          } as CharacterEvent);
        } catch (error) {
          console.error("Failed to handle SSE event:", error);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        setSseDisabled(true);
        setIsPolling(true);
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (error) {
      console.error(
        "Failed to create EventSource, falling back to polling",
        error,
      );
      setSseDisabled(true);
      setIsPolling(true);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [characterId, publishEvent, sseDisabled]);

  const handleManualReconnect = useCallback(() => {
    setSseDisabled(false);
    setIsPolling(false);
    setLastEventTimestamp(null);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  return { sseDisabled, isPolling, handleManualReconnect };
}
