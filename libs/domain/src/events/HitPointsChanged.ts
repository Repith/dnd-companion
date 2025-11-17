import { DomainEvent } from "./DomainEvent";

class HitPointsChanged extends DomainEvent {
  readonly characterId: string;
  readonly oldHp: number;
  readonly newHp: number;

  constructor(characterId: string, oldHp: number, newHp: number) {
    super("HitPointsChanged");
    this.characterId = characterId;
    this.oldHp = oldHp;
    this.newHp = newHp;
  }
}

export { HitPointsChanged };
