import {
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsString,
} from "class-validator";

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  equipped?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
