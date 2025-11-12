import { IsEnum, IsOptional, IsUUID, IsObject } from "class-validator";
import { EventType } from "../../campaign/dto/types";

export class CreateEventDto {
  @IsEnum(EventType)
  type!: EventType;

  @IsOptional()
  @IsUUID("4")
  actorId?: string;

  @IsOptional()
  @IsUUID("4")
  targetId?: string;

  @IsOptional()
  @IsObject()
  payload?: any;
}
