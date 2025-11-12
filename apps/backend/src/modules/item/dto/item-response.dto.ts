import { Expose, Type } from "class-transformer";
import { ItemType, Rarity, ItemProperties, ItemEffects } from "./types";

export class ItemPropertiesResponseDto {
  @Expose()
  damageDice?: string;

  @Expose()
  armorClassBonus?: number;

  @Expose()
  requiredProficiency?: string;

  @Expose()
  attunement?: boolean;

  @Expose()
  charges?: number;

  @Expose()
  maxCharges?: number;
}

export class ItemEffectsResponseDto {
  @Expose()
  abilityScoreModifiers?: Record<string, number>;

  @Expose()
  skillModifiers?: Record<string, number>;

  @Expose()
  savingThrowModifiers?: Record<string, number>;
}

export class ItemResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: ItemType;

  @Expose()
  rarity!: Rarity;

  @Expose()
  weight!: number;

  @Expose()
  @Type(() => ItemPropertiesResponseDto)
  properties?: ItemPropertiesResponseDto;

  @Expose()
  @Type(() => ItemEffectsResponseDto)
  effects?: ItemEffectsResponseDto;

  @Expose()
  source?: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
