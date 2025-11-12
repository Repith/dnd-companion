import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsObject,
  IsBoolean,
} from "class-validator";
import { ItemType, Rarity, ItemProperties, ItemEffects } from "./types";

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ItemType)
  type!: ItemType;

  @IsOptional()
  @IsEnum(Rarity)
  rarity?: Rarity;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsObject()
  properties?: ItemProperties;

  @IsOptional()
  @IsObject()
  effects?: ItemEffects;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
