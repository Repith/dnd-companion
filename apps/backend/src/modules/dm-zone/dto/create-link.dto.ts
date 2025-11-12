import { IsNotEmpty, IsString } from "class-validator";

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  relatedEntityType!: string;

  @IsString()
  @IsNotEmpty()
  relatedEntityId!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;
}
