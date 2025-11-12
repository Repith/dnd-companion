import { Expose, Type } from "class-transformer";
import { OwnerType } from "./types";

export class InventoryItemResponseDto {
  @Expose()
  id!: string;

  @Expose()
  itemId!: string;

  @Expose()
  @Type(() => Object)
  item!: {
    id: string;
    name: string;
    type: string;
    weight: number;
    rarity: string;
  };

  @Expose()
  quantity!: number;

  @Expose()
  equipped!: boolean;

  @Expose()
  notes?: string;
}

export class EncumbranceResponseDto {
  @Expose()
  currentWeight!: number;

  @Expose()
  maxWeight!: number;

  @Expose()
  isEncumbered!: boolean;
}

export class InventoryResponseDto {
  @Expose()
  id!: string;

  @Expose()
  ownerType!: OwnerType;

  @Expose()
  ownerId!: string;

  @Expose()
  @Type(() => InventoryItemResponseDto)
  items!: InventoryItemResponseDto[];

  @Expose()
  @Type(() => EncumbranceResponseDto)
  encumbrance?: EncumbranceResponseDto;
}
