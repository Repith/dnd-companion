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
}

export interface ItemEffects {
  abilityScoreModifiers?: Record<string, number>;
  skillModifiers?: Record<string, number>;
  savingThrowModifiers?: Record<string, number>;
}

export interface CreateItemDto {
  name: string;
  type: ItemType;
  rarity?: Rarity;
  weight?: number;
  properties?: ItemProperties;
  effects?: ItemEffects;
  source?: string;
  description?: string;
}

export interface UpdateItemDto {
  name?: string;
  type?: ItemType;
  rarity?: Rarity;
  weight?: number;
  properties?: ItemProperties;
  effects?: ItemEffects;
  source?: string;
  description?: string;
}

export interface ItemPropertiesResponseDto {
  damageDice?: string;
  armorClassBonus?: number;
  requiredProficiency?: string;
  attunement?: boolean;
  charges?: number;
  maxCharges?: number;
}

export interface ItemEffectsResponseDto {
  abilityScoreModifiers?: Record<string, number>;
  skillModifiers?: Record<string, number>;
  savingThrowModifiers?: Record<string, number>;
}

export interface ItemResponseDto {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  weight: number;
  properties?: ItemPropertiesResponseDto;
  effects?: ItemEffectsResponseDto;
  source?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
