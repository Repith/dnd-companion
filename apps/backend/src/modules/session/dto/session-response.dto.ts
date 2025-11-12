import { Exclude, Expose } from "class-transformer";

export class SessionResponseDto {
  @Expose()
  id!: string;

  @Expose()
  campaignId!: string;

  @Expose()
  date!: Date;

  @Expose()
  notes!: string | null;

  @Expose()
  playerCharacterIds!: string[];

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<SessionResponseDto>) {
    Object.assign(this, partial);
  }
}
