import { Exclude, Expose } from "class-transformer";
import { EventType } from "../../campaign/dto/types";

export class EventResponseDto {
  @Expose()
  id!: string;

  @Expose()
  type!: EventType;

  @Expose()
  timestamp!: Date;

  @Expose()
  actorId!: string | null;

  @Expose()
  targetId!: string | null;

  @Expose()
  payload!: any;

  @Expose()
  sessionId!: string;

  constructor(partial: Partial<EventResponseDto>) {
    Object.assign(this, partial);
  }
}
