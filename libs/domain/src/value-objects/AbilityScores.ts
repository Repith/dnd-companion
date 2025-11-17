import { AbilityName } from "../enums/ability-name";

export class AbilityScores {
  public readonly strength: number;
  public readonly dexterity: number;
  public readonly constitution: number;
  public readonly intelligence: number;
  public readonly wisdom: number;
  public readonly charisma: number;

  constructor(
    strength: number,
    dexterity: number,
    constitution: number,
    intelligence: number,
    wisdom: number,
    charisma: number,
  ) {
    this.validateScore(strength);
    this.validateScore(dexterity);
    this.validateScore(constitution);
    this.validateScore(intelligence);
    this.validateScore(wisdom);
    this.validateScore(charisma);

    this.strength = strength;
    this.dexterity = dexterity;
    this.constitution = constitution;
    this.intelligence = intelligence;
    this.wisdom = wisdom;
    this.charisma = charisma;
  }

  private validateScore(score: number): void {
    if (!Number.isInteger(score) || score < 3 || score > 20) {
      throw new Error(
        `Ability score must be an integer between 3 and 20, got ${score}`,
      );
    }
  }

  public static getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  public getScore(ability: AbilityName): number {
    switch (ability) {
      case AbilityName.STRENGTH:
        return this.strength;
      case AbilityName.DEXTERITY:
        return this.dexterity;
      case AbilityName.CONSTITUTION:
        return this.constitution;
      case AbilityName.INTELLIGENCE:
        return this.intelligence;
      case AbilityName.WISDOM:
        return this.wisdom;
      case AbilityName.CHARISMA:
        return this.charisma;
      default:
        throw new Error(`Unknown ability: ${ability}`);
    }
  }

  public getModifier(ability: AbilityName): number {
    return AbilityScores.getModifier(this.getScore(ability));
  }
}
