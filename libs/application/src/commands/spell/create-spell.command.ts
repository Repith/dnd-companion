import { ICommand } from "@nestjs/cqrs";
import { SpellSchool } from "@dnd-companion/domain";

interface SpellComponents {
  verbal?: boolean;
  somatic?: boolean;
  material?: string;
}

interface SpellDuration {
  duration: string;
  concentration?: boolean;
}

export class CreateSpellCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly level: number,
    public readonly duration: SpellDuration,
    public readonly classes: string[],
    public readonly school?: SpellSchool,
    public readonly castingTime?: string,
    public readonly range?: string,
    public readonly components?: SpellComponents,
    public readonly description?: string,
    public readonly higherLevel?: string,
    public readonly userId?: string,
  ) {}
}
