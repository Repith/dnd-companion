import { LevelUpEvent } from "../../events/dto";

export class LevelUpDomainEvent implements LevelUpEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  campaignId?: string;
  global?: boolean;
  type: "LEVEL_UP";
  payload: {
    newLevel: number;
    oldLevel: number;
  };

  constructor(
    targetId: string,
    newLevel: number,
    oldLevel: number,
    sessionId?: string,
    actorId?: string,
    campaignId?: string,
    global?: boolean,
  ) {
    this.targetId = targetId;
    this.type = "LEVEL_UP";
    this.payload = {
      newLevel,
      oldLevel,
    };
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
    if (campaignId !== undefined) this.campaignId = campaignId;
    if (global !== undefined) this.global = global;
  }
}
