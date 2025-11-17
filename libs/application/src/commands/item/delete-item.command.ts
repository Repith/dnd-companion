import { ICommand } from "@nestjs/cqrs";

export class DeleteItemCommand implements ICommand {
  constructor(public readonly id: string, public readonly userId?: string) {}
}
