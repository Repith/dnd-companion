import { IsBoolean } from "class-validator";

export class EquipItemDto {
  @IsBoolean()
  equipped!: boolean;
}
