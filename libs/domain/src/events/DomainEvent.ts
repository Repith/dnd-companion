import { randomUUID } from "crypto";

abstract class DomainEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly eventType: string;

  protected constructor(eventType: string) {
    this.id = randomUUID();
    this.timestamp = new Date();
    this.eventType = eventType;
  }
}

export { DomainEvent };
