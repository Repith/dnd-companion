import { QuestFinishedEvent } from "../../events/dto";

export class QuestFinishedDomainEvent implements QuestFinishedEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  type: "QUEST_FINISHED";
  payload: {
    questId: string;
    experienceReward: number;
    loot: any[];
  };

  constructor(
    questId: string,
    experienceReward: number,
    loot: any[],
    sessionId?: string,
    actorId?: string,
  ) {
    this.targetId = questId;
    this.type = "QUEST_FINISHED";
    this.payload = {
      questId,
      experienceReward,
      loot,
    };
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
  }
}
