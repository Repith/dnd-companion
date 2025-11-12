import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsObject,
} from "class-validator";
import { ItemType, Rarity, ItemProperties, ItemEffects } from "./types";

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

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
