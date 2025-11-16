import { EventType } from "./event-types";
import { JsonValue } from "@prisma/client/runtime/library";

/**
 * Event response DTO for API responses
 */
export interface EventResponseDto {
  id: string;
  type: EventType;
  timestamp: Date;
  actorId: string | null;
  targetId: string | null;
  sessionId: string | null;
  campaignId: string | null;
  global: boolean | null;
  payload: JsonValue | null;
}

/**
 * Event query filter DTO
 */
export interface EventQueryDto {
  type?: EventType;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  campaignId?: string;
  global?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Event statistics DTO
 */
export interface EventStatsDto {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsBySession: Record<string, number>;
  eventsByCampaign: Record<string, number>;
  recentEvents: EventResponseDto[];
}
