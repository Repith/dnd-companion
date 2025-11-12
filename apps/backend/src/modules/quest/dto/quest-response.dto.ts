import { Exclude, Expose } from "class-transformer";
import { QuestStatus } from "./types";

export class QuestResponseDto {
  @Expose()
  id!: string;

  @Expose()
  campaignId!: string;

  @Expose()
  name!: string;

  @Expose()
  summary!: string | null;

  @Expose()
  description!: string | null;

  @Expose()
  status!: QuestStatus;

  @Expose()
  experienceReward!: number;

  @Expose()
  loot!: any;

  @Expose()
  npcIds!: string[];

  @Expose()
  locationIds!: string[];

  @Expose()
  notes!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<QuestResponseDto>) {
    Object.assign(this, partial);
  }
}
