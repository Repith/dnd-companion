import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException } from "@nestjs/common";
import { SpellRepository, Spell } from "@dnd-companion/domain";
import { CreateSpellCommand } from "../../commands/spell/create-spell.command";

@Injectable()
@CommandHandler(CreateSpellCommand)
export class CreateSpellHandler implements ICommandHandler<CreateSpellCommand> {
  constructor(private readonly spellRepository: SpellRepository) {}

  async execute(command: CreateSpellCommand): Promise<string> {
    const {
      name,
      level,
      duration,
      classes,
      school,
      castingTime,
      range,
      components,
      description,
      higherLevel,
      userId,
    } = command;

    // Check if spell with same name already exists
    const existingSpell = await this.spellRepository.findByName(name);
    if (existingSpell) {
      throw new BadRequestException("Spell with this name already exists");
    }

    // Generate ID
    const id = `spell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const spell = new Spell(
      id,
      name,
      level,
      duration,
      classes,
      school,
      castingTime,
      range,
      components,
      description,
      higherLevel,
      userId,
      "PUBLIC",
    );

    await this.spellRepository.save(spell);

    return id;
  }
}
