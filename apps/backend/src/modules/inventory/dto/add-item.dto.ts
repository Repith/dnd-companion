import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class AddItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;

  @IsOptional()
  @IsString()
  notes?: string;
}
