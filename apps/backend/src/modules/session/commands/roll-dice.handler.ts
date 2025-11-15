import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { EventBusService } from "../../events/event-bus.service";
import { RollDiceCommand } from "./roll-dice.command";
import { RollDomainEvent } from "../events/roll.event";

@Injectable()
@CommandHandler(RollDiceCommand)
export class RollDiceHandler implements ICommandHandler<RollDiceCommand> {
  constructor(private readonly eventBus: EventBusService) {}

  async execute(command: RollDiceCommand): Promise<void> {
    const {
      notation,
      result,
      label,
      characterId,
      individualResults,
      sessionId,
    } = command;

    // Publish RollEvent
    const event = new RollDomainEvent(
      notation,
      result,
      individualResults || [],
      sessionId,
      undefined, // actorId - could be userId if needed
      label,
      characterId,
    );

    await this.eventBus.publish(event);
  }
}
