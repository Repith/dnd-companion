import { ICommand } from "@nestjs/cqrs";

export class DeleteSpellCommand implements ICommand {
  constructor(public readonly id: string, public readonly userId?: string) {}
}
