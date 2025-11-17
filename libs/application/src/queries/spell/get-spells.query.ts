import { IQuery } from "@nestjs/cqrs";
import { SpellSchool } from "@dnd-companion/domain";

export class GetSpellsQuery implements IQuery {
  constructor(
    public readonly level?: number,
    public readonly school?: SpellSchool,
    public readonly spellClass?: string,
    public readonly search?: string,
    public readonly userId?: string,
  ) {}
}
