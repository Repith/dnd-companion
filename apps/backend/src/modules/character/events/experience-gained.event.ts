import { ExperienceGainedEvent } from "../../events/dto";

export class ExperienceGainedDomainEvent implements ExperienceGainedEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  campaignId?: string;
  global?: boolean;
  type: "EXPERIENCE_GAINED";
  payload: {
    experienceGained: number;
    totalExperience: number;
  };

  constructor(
    targetId: string,
    experienceGained: number,
    totalExperience: number,
    sessionId?: string,
    actorId?: string,
    campaignId?: string,
    global?: boolean,
  ) {
    this.targetId = targetId;
    this.type = "EXPERIENCE_GAINED";
    this.payload = {
      experienceGained,
      totalExperience,
    };
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
    if (campaignId !== undefined) this.campaignId = campaignId;
    if (global !== undefined) this.global = global;
  }
}
