import {
  QuestStatus as QuestStatusConst,
  EventType as EventTypeConst,
} from "@prisma/client";
import type {
  QuestStatus as QuestStatusType,
  EventType as EventTypeType,
} from "@prisma/client";

export const QuestStatus = QuestStatusConst;
export type QuestStatus = QuestStatusType;

export const EventType = EventTypeConst;
export type EventType = EventTypeType;
