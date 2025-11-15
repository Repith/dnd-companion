import { ICommand } from "@nestjs/cqrs";

export class FinishQuestCommand implements ICommand {
  constructor(
    public readonly questId: string,
    public readonly userId?: string,
  ) {}
}
