import { Exclude, Expose } from "class-transformer";

export class GeneratedEntityResponseDto {
  @Expose()
  id!: string;

  @Expose()
  entityType!: string;

  @Expose()
  data!: any;

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<GeneratedEntityResponseDto>) {
    Object.assign(this, partial);
  }
}
