import { IQuery } from "@nestjs/cqrs";

export class GetItemQuery implements IQuery {
  constructor(public readonly id: string, public readonly userId?: string) {}
}
