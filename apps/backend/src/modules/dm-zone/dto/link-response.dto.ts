import { Exclude, Expose } from "class-transformer";

export class LinkResponseDto {
  @Expose()
  id!: string;

  @Expose()
  noteId!: string;

  @Expose()
  relatedEntityType!: string;

  @Expose()
  relatedEntityId!: string;

  @Expose()
  relationship!: string;

  constructor(partial: Partial<LinkResponseDto>) {
    Object.assign(this, partial);
  }
}
