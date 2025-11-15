import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { EventBusService } from "../../events/event-bus.service";
import { UpdateCharacterLevelCommand } from "./update-character-level.command";
import { LevelUpDomainEvent } from "../events/level-up.event";
import { calculateProficiencyBonus } from "../../../common/constants";

@Injectable()
@CommandHandler(UpdateCharacterLevelCommand)
export class UpdateCharacterLevelHandler
  implements ICommandHandler<UpdateCharacterLevelCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(command: UpdateCharacterLevelCommand): Promise<void> {
    const { characterId, newLevel, userId } = command;

    if (newLevel < 1 || newLevel > 20) {
      throw new BadRequestException("Level must be between 1 and 20");
    }

    // Validate character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new BadRequestException("You don't have access to this character");
    }

    const oldLevel = character.level;

    if (newLevel === oldLevel) {
      throw new BadRequestException(
        "New level must be different from current level",
      );
    }

    // Calculate new proficiency bonus
    const proficiencyBonus = calculateProficiencyBonus(newLevel);

    // Update character level and proficiency bonus
    await this.prisma.character.update({
      where: { id: characterId },
      data: {
        level: newLevel,
        proficiencyBonus,
      },
    });

    // Publish level up event (or level down, but typically it's level up)
    const levelUpEvent = new LevelUpDomainEvent(
      characterId,
      newLevel,
      oldLevel,
      character.campaignId || undefined,
      userId,
    );

    await this.eventBus.publish(levelUpEvent);
  }
}
