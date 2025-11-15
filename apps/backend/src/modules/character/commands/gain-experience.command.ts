import { ICommand } from "@nestjs/cqrs";

export class GainExperienceCommand implements ICommand {
  constructor(
    public readonly characterId: string,
    public readonly experienceGained: number,
    public readonly userId?: string,
  ) {}
}
