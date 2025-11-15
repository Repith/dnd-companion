import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { EventBusService } from "../../events/event-bus.service";
import { GainExperienceCommand } from "./gain-experience.command";
import { ExperienceGainedDomainEvent } from "../events/experience-gained.event";
import { LevelUpDomainEvent } from "../events/level-up.event";
import {
  calculateLevelFromExperience,
  calculateProficiencyBonus,
} from "../../../common/constants";

@Injectable()
@CommandHandler(GainExperienceCommand)
export class GainExperienceHandler
  implements ICommandHandler<GainExperienceCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(command: GainExperienceCommand): Promise<void> {
    const { characterId, experienceGained, userId } = command;

    if (experienceGained <= 0) {
      throw new BadRequestException("Experience gained must be positive");
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

    const oldExperience = character.experiencePoints;
    const newExperience = oldExperience + experienceGained;
    const oldLevel = character.level;
    const newLevel = calculateLevelFromExperience(newExperience);

    // Update character experience
    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { experiencePoints: newExperience },
    });

    // Publish experience gained event
    const experienceEvent = new ExperienceGainedDomainEvent(
      characterId,
      experienceGained,
      newExperience,
      character.campaignId || undefined,
      userId,
    );

    await this.eventBus.publish(experienceEvent);

    // Check if level up occurred
    if (newLevel > oldLevel) {
      // Update level and proficiency bonus
      const proficiencyBonus = calculateProficiencyBonus(newLevel);

      await this.prisma.character.update({
        where: { id: characterId },
        data: {
          level: newLevel,
          proficiencyBonus,
        },
      });

      // Publish level up event
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
}
