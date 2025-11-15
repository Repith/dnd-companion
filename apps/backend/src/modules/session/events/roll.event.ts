import { RollEvent } from "../../events/dto";

export class RollDomainEvent implements RollEvent {
  id?: string;
  timestamp?: Date;
  actorId?: string;
  targetId?: string | undefined;
  sessionId?: string;
  type: "DICE_ROLL";
  payload: {
    notation: string;
    result: number;
    label?: string;
    characterId?: string;
    individualResults: number[];
  };

  constructor(
    notation: string,
    result: number,
    individualResults: number[],
    sessionId?: string,
    actorId?: string,
    label?: string,
    characterId?: string,
  ) {
    if (characterId !== undefined) this.targetId = characterId;
    this.type = "DICE_ROLL";
    this.payload = {
      notation,
      result,
      individualResults,
    };
    if (label !== undefined) this.payload.label = label;
    if (characterId !== undefined) this.payload.characterId = characterId;
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (actorId !== undefined) this.actorId = actorId;
  }
}
