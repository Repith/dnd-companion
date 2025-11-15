import { SkillProficiencyAddedEvent } from "../../events/dto";

export class SkillProficiencyAddedDomainEvent
  implements SkillProficiencyAddedEvent
{
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  type: "SKILL_PROFICIENCY_ADDED";
  payload: {
    skill: string;
    proficient: boolean;
    expertise: boolean;
  };

  constructor(
    targetId: string,
    skill: string,
    proficient: boolean,
    expertise: boolean,
    sessionId?: string,
    actorId?: string,
  ) {
    this.targetId = targetId;
    this.type = "SKILL_PROFICIENCY_ADDED";
    this.payload = {
      skill,
      proficient,
      expertise,
    };
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
  }
}
