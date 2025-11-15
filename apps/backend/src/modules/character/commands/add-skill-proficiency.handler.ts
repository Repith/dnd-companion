import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { EventBusService } from "../../events/event-bus.service";
import { AddSkillProficiencyCommand } from "./add-skill-proficiency.command";
import { SkillProficiencyAddedDomainEvent } from "../events/skill-proficiency-added.event";

@Injectable()
@CommandHandler(AddSkillProficiencyCommand)
export class AddSkillProficiencyHandler
  implements ICommandHandler<AddSkillProficiencyCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(command: AddSkillProficiencyCommand): Promise<void> {
    const { characterId, skill, proficient, expertise, userId } = command;

    // Validate character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { skillProficiencies: true },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new BadRequestException("You don't have access to this character");
    }

    // Check if skill proficiency already exists
    const existingProficiency = character.skillProficiencies.find(
      (prof) => prof.skill === skill,
    );

    let proficiency;
    if (existingProficiency) {
      if (proficient || expertise) {
        // Update existing proficiency
        proficiency = await this.prisma.skillProficiency.update({
          where: { id: existingProficiency.id },
          data: { proficient, expertise },
        });
      } else {
        // Remove proficiency if both false
        await this.prisma.skillProficiency.delete({
          where: { id: existingProficiency.id },
        });
        proficiency = { proficient: false, expertise: false };
      }
    } else {
      if (proficient || expertise) {
        // Create new proficiency
        proficiency = await this.prisma.skillProficiency.create({
          data: {
            characterId,
            skill,
            proficient,
            expertise,
          },
        });
      } else {
        // No need to create if both false
        proficiency = { proficient: false, expertise: false };
      }
    }

    // Publish event
    const event = new SkillProficiencyAddedDomainEvent(
      characterId,
      skill,
      proficiency.proficient,
      proficiency.expertise,
      character.campaignId || undefined, // Use campaign as session
      userId,
    );

    await this.eventBus.publish(event);
  }
}
