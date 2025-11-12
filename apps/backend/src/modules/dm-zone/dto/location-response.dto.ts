import { Exclude, Expose } from "class-transformer";
import { LocationType } from "./types";

export class LocationResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: LocationType;

  @Expose()
  description!: string | null;

  @Expose()
  mapUrl!: string | null;

  @Expose()
  parentId!: string | null;

  @Expose()
  npcIds!: string[];

  @Expose()
  questIds!: string[];

  @Expose()
  campaignIds!: string[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<LocationResponseDto>) {
    Object.assign(this, partial);
  }
}
