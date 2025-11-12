import { IsNotEmpty, IsString } from "class-validator";

export class CreateDMNoteDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
