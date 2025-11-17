export { ItemType } from "@dnd-companion/domain";
export { Rarity } from "@dnd-companion/domain";

export interface ItemProperties {
  damageDice?: string;
  armorClassBonus?: number;
  requiredProficiency?: string;
  attunement?: boolean;
  charges?: number;
  maxCharges?: number;
  [key: string]: any;
}

export interface ItemEffects {
  abilityScoreModifiers?: Record<string, number>;
  skillModifiers?: Record<string, number>;
  savingThrowModifiers?: Record<string, number>;
  [key: string]: any;
}
