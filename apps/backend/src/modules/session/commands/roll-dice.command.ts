import { ICommand } from "@nestjs/cqrs";

export class RollDiceCommand implements ICommand {
  constructor(
    public readonly notation: string,
    public readonly result: number,
    public readonly label?: string,
    public readonly characterId?: string,
    public readonly individualResults?: number[],
    public readonly sessionId?: string,
  ) {}
}
