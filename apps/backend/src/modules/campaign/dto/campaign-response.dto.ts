import { Exclude, Expose } from "class-transformer";

export class CampaignResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string | null;

  @Expose()
  dmId!: string;

  @Expose()
  playerIds!: string[];

  @Expose()
  questIds!: string[];

  @Expose()
  npcIds!: string[];

  @Expose()
  locationIds!: string[];

  @Expose()
  currentSessionId!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<CampaignResponseDto>) {
    Object.assign(this, partial);
  }
}
