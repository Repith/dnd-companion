export enum ItemType {
  WEAPON = "WEAPON",
  ARMOR = "ARMOR",
  TOOL = "TOOL",
  CONSUMABLE = "CONSUMABLE",
  MAGIC_ITEM = "MAGIC_ITEM",
  LOOT = "LOOT",
}

export enum Rarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  VERY_RARE = "VERY_RARE",
  LEGENDARY = "LEGENDARY",
}

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
