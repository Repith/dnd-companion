import { ICommand } from "@nestjs/cqrs";

export class UpdateCharacterLevelCommand implements ICommand {
  constructor(
    public readonly characterId: string,
    public readonly newLevel: number,
    public readonly userId?: string,
  ) {}
}
