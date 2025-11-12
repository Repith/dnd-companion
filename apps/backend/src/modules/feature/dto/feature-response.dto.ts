import { Exclude, Expose } from "class-transformer";

export class FeatureResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string;

  @Expose()
  source!: string;

  @Expose()
  level?: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<FeatureResponseDto>) {
    Object.assign(this, partial);
  }
}
