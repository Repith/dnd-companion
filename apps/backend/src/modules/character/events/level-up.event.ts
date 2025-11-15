import { LevelUpEvent } from "../../events/dto";

export class LevelUpDomainEvent implements LevelUpEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
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
  ) {
    this.targetId = targetId;
    this.type = "LEVEL_UP";
    this.payload = {
      newLevel,
      oldLevel,
    };
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
  }
}
