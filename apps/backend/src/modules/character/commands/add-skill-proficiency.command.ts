import { ICommand } from "@nestjs/cqrs";
import { SkillName } from "../dto";

export class AddSkillProficiencyCommand implements ICommand {
  constructor(
    public readonly characterId: string,
    public readonly skill: SkillName,
    public readonly proficient: boolean,
    public readonly expertise: boolean,
    public readonly userId?: string,
  ) {}
}
