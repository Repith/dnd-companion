import { IsString, IsInt, IsArray, IsOptional, IsUUID } from "class-validator";

export class CreateDiceRollDto {
  @IsString()
  diceType!: string;

  @IsInt()
  numberOfDice!: number;

  @IsArray()
  @IsInt({ each: true })
  individualResults!: number[];

  @IsInt()
  totalResult!: number;

  @IsOptional()
  @IsUUID()
  characterId?: string;
}
