import { DomainEvent } from "./DomainEvent";

class ItemEquipped extends DomainEvent {
  readonly characterId: string;
  readonly itemId: string;

  constructor(characterId: string, itemId: string) {
    super("ItemEquipped");
    this.characterId = characterId;
    this.itemId = itemId;
  }
}

export { ItemEquipped };
