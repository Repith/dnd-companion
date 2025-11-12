import { Exclude, Expose } from "class-transformer";

export class DMNoteResponseDto {
  @Expose()
  id!: string;

  @Expose()
  content!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<DMNoteResponseDto>) {
    Object.assign(this, partial);
  }
}
