import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { SpellRepository } from "@dnd-companion/domain";
import { GetSpellQuery } from "../../queries/spell/get-spell.query";

@Injectable()
@QueryHandler(GetSpellQuery)
export class GetSpellHandler implements IQueryHandler<GetSpellQuery> {
  constructor(private readonly spellRepository: SpellRepository) {}

  async execute(query: GetSpellQuery): Promise<any> {
    const { id, userId } = query;

    const spell = await this.spellRepository.findByIdWithAccessCheck(
      id,
      userId,
    );
    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    return this.mapToResponseDto(spell);
  }

  private mapToResponseDto(spell: any): any {
    return {
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      classes: spell.classes,
      description: spell.description,
      higherLevel: spell.higherLevel,
      createdAt: spell.createdAt,
      updatedAt: spell.updatedAt,
    };
  }
}
