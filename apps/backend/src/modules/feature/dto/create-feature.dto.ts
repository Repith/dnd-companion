import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number;
}
