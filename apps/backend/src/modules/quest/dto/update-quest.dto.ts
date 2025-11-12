import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";
import { QuestStatus } from "./types";

export class UpdateQuestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(QuestStatus)
  status?: QuestStatus;

  @IsOptional()
  @IsNumber()
  experienceReward?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  npcIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
