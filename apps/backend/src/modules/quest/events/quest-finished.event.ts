import { QuestFinishedEvent } from "../../events/dto";

export class QuestFinishedDomainEvent implements QuestFinishedEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  campaignId?: string;
  global?: boolean;
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
    campaignId?: string,
    global?: boolean,
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
    if (campaignId !== undefined) this.campaignId = campaignId;
    if (global !== undefined) this.global = global;
  }
}
