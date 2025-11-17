import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { SpellRepository } from "@dnd-companion/domain";
import { UpdateSpellCommand } from "../../commands/spell/update-spell.command";

@Injectable()
@CommandHandler(UpdateSpellCommand)
export class UpdateSpellHandler implements ICommandHandler<UpdateSpellCommand> {
  constructor(private readonly spellRepository: SpellRepository) {}

  async execute(command: UpdateSpellCommand): Promise<void> {
    const { id, name, userId, ...updates } = command;

    const spell = await this.spellRepository.findByIdWithAccessCheck(
      id,
      userId,
    );
    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    if (!spell.canBeModifiedBy(userId)) {
      throw new BadRequestException("Cannot modify this spell");
    }

    // Check for name conflicts if name is being updated
    if (name && name !== spell.name) {
      const existingSpell = await this.spellRepository.findByName(name);
      if (existingSpell) {
        throw new BadRequestException("Spell with this name already exists");
      }
    }

    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filteredUpdates[key] = value;
    }
    spell.updateBasicInfo({ ...filteredUpdates, ...(name && { name }) });

    await this.spellRepository.save(spell);
  }
}
