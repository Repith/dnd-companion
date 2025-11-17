import { IQuery } from "@nestjs/cqrs";

export class GetSpellQuery implements IQuery {
  constructor(public readonly id: string, public readonly userId?: string) {}
}
