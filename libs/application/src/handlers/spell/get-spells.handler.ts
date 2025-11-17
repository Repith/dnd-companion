import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { SpellRepository, SpellFilters } from "@dnd-companion/domain";
import { GetSpellsQuery } from "../../queries/spell/get-spells.query";

@Injectable()
@QueryHandler(GetSpellsQuery)
export class GetSpellsHandler implements IQueryHandler<GetSpellsQuery> {
  constructor(private readonly spellRepository: SpellRepository) {}

  async execute(query: GetSpellsQuery): Promise<any[]> {
    const { level, school, spellClass, search, userId } = query;

    const filters: SpellFilters = {};
    if (level !== undefined) filters.level = level;
    if (school !== undefined) filters.school = school;
    if (spellClass !== undefined) filters.class = spellClass;
    if (search !== undefined) filters.search = search;
    if (userId !== undefined) filters.userId = userId;

    const spells = await this.spellRepository.findAllWithFilters(filters);

    return spells.map((spell) => this.mapToResponseDto(spell));
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
