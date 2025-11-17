import { DomainEvent } from "./DomainEvent";

class SpellCast extends DomainEvent {
  readonly characterId: string;
  readonly spellId: string;

  constructor(characterId: string, spellId: string) {
    super("SpellCast");
    this.characterId = characterId;
    this.spellId = spellId;
  }
}

export { SpellCast };
