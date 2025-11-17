import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { SpellRepository } from "@dnd-companion/domain";
import { DeleteSpellCommand } from "../../commands/spell/delete-spell.command";

@Injectable()
@CommandHandler(DeleteSpellCommand)
export class DeleteSpellHandler implements ICommandHandler<DeleteSpellCommand> {
  constructor(private readonly spellRepository: SpellRepository) {}

  async execute(command: DeleteSpellCommand): Promise<void> {
    const { id, userId } = command;

    const spell = await this.spellRepository.findByIdWithAccessCheck(
      id,
      userId,
    );
    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    if (!spell.canBeModifiedBy(userId)) {
      throw new BadRequestException("Cannot delete this spell");
    }

    // Check if spell is being used by any characters
    const usageCount = await this.spellRepository.countSpellsUsing(id);
    if (usageCount > 0) {
      throw new BadRequestException(
        "Cannot delete spell that is currently known or prepared by characters",
      );
    }

    await this.spellRepository.delete(id);
  }
}
