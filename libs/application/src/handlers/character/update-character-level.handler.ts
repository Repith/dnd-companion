import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  CharacterRepository,
  calculateProficiencyBonus,
} from "@dnd-companion/domain";
import { UpdateCharacterLevelCommand } from "../../commands/character/update-character-level.command";

@Injectable()
@CommandHandler(UpdateCharacterLevelCommand)
export class UpdateCharacterLevelHandler
  implements ICommandHandler<UpdateCharacterLevelCommand>
{
  constructor(private readonly characterRepository: CharacterRepository) {}

  async execute(command: UpdateCharacterLevelCommand): Promise<void> {
    const { characterId, newLevel, userId } = command;

    if (newLevel < 1 || newLevel > 20) {
      throw new BadRequestException("Level must be between 1 and 20");
    }

    // Validate character exists and user has access
    const character = await this.characterRepository.findByIdWithAccessCheck(
      characterId,
      userId,
    );

    if (!character) {
      throw new NotFoundException("Character not found");
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
    await this.characterRepository.updateLevel(
      characterId,
      newLevel,
      proficiencyBonus,
    );
  }
}
