import { Race } from "../enums/race";
import { CharacterClass } from "../enums/character-class";
import { Alignment } from "../enums/alignment";
import { AbilityScores } from "../value-objects/AbilityScores";
import { HitPoints } from "../value-objects/HitPoints";
import { SkillProficiency } from "../value-objects/SkillProficiency";
import { SkillName } from "../enums/skill-name";
import { AbilityName } from "../enums/ability-name";

export class Character {
  public readonly id: string;
  private _name: string;
  private _race: Race;
  private _characterClass: CharacterClass;
  private _level: number;
  private _abilityScores: AbilityScores;
  private _hitPoints: HitPoints;
  private _alignment: Alignment;
  private _skillProficiencies: SkillProficiency[] = [];

  constructor(
    id: string,
    name: string,
    race: Race,
    characterClass: CharacterClass,
    level: number,
    abilityScores: AbilityScores,
    hitPoints: HitPoints,
    alignment: Alignment,
    skillProficiencies: SkillProficiency[] = [],
  ) {
    this.id = id;
    this._name = name;
    this._race = race;
    this._characterClass = characterClass;
    this._level = level;
    this._abilityScores = abilityScores;
    this._hitPoints = hitPoints;
    this._alignment = alignment;
    this._skillProficiencies = [...skillProficiencies];
  }

  get name(): string {
    return this._name;
  }

  get race(): Race {
    return this._race;
  }

  get characterClass(): CharacterClass {
    return this._characterClass;
  }

  get level(): number {
    return this._level;
  }

  get abilityScores(): AbilityScores {
    return this._abilityScores;
  }

  get hitPoints(): HitPoints {
    return this._hitPoints;
  }

  get alignment(): Alignment {
    return this._alignment;
  }

  get skillProficiencies(): SkillProficiency[] {
    return [...this._skillProficiencies];
  }

  levelUp(): void {
    this._level += 1;
    const conMod = this._abilityScores.getModifier(AbilityName.CONSTITUTION);
    const hpIncrease = 5 + conMod;
    this._hitPoints = new HitPoints(
      this._hitPoints.current,
      this._hitPoints.max + hpIncrease,
    );
  }

  takeDamage(amount: number): void {
    this._hitPoints = this._hitPoints.takeDamage(amount);
  }

  heal(amount: number): void {
    this._hitPoints = this._hitPoints.heal(amount);
  }

  addSkillProficiency(skill: SkillName, bonus: number): void {
    this._skillProficiencies.push(new SkillProficiency(skill, bonus));
  }
}
