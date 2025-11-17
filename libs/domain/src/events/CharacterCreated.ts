import { DomainEvent } from "./DomainEvent";

class CharacterCreated extends DomainEvent {
  readonly characterId: string;
  readonly name: string;
  readonly race: string;
  readonly characterClass: string;

  constructor(
    characterId: string,
    name: string,
    race: string,
    characterClass: string,
  ) {
    super("CharacterCreated");
    this.characterId = characterId;
    this.name = name;
    this.race = race;
    this.characterClass = characterClass;
  }
}

export { CharacterCreated };
