import { ICommand } from "@nestjs/cqrs";
import { ItemType, Rarity } from "@dnd-companion/domain";

interface ItemProperties {
  damageDice?: string;
  armorClassBonus?: number;
  requiredProficiency?: string;
  attunement?: boolean;
  charges?: number;
  maxCharges?: number;
  [key: string]: any;
}

interface ItemEffects {
  abilityScoreModifiers?: Record<string, number>;
  skillModifiers?: Record<string, number>;
  savingThrowModifiers?: Record<string, number>;
  [key: string]: any;
}

export class UpdateItemCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly weight?: number,
    public readonly properties?: ItemProperties,
    public readonly effects?: ItemEffects,
    public readonly source?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}
