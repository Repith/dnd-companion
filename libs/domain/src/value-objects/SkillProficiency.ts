import { SkillName } from "../enums/skill-name";

export class SkillProficiency {
  public readonly skillName: SkillName;
  public readonly bonus: number;

  constructor(skillName: SkillName, bonus: number) {
    this.skillName = skillName;
    this.bonus = bonus;
  }

  public addBonus(additionalBonus: number): SkillProficiency {
    return new SkillProficiency(this.skillName, this.bonus + additionalBonus);
  }

  public toString(): string {
    return `${this.skillName}: +${this.bonus}`;
  }
}
