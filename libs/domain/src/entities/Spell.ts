import { SpellSchool } from "../enums/spell-school";

interface SpellComponents {
  verbal?: boolean;
  somatic?: boolean;
  material?: string;
}

interface SpellDuration {
  duration: string;
  concentration?: boolean;
}

export class Spell {
  public readonly id: string;
  private _name: string;
  private _level: number;
  private _school: SpellSchool | undefined;
  private _castingTime: string | undefined;
  private _range: string | undefined;
  private _components: SpellComponents | undefined;
  private _duration: SpellDuration;
  private _classes: string[];
  private _description: string | undefined;
  private _higherLevel: string | undefined;
  private _creatorId: string | undefined;
  private _visibility: "PUBLIC" | "PRIVATE" = "PUBLIC";
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    level: number,
    duration: SpellDuration,
    classes: string[],
    school?: SpellSchool,
    castingTime?: string,
    range?: string,
    components?: SpellComponents,
    description?: string,
    higherLevel?: string,
    creatorId?: string,
    visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.validateSpellData({ name, level, duration, classes, components });
    this.id = id;
    this._name = name;
    this._level = level;
    this._school = school;
    this._castingTime = castingTime;
    this._range = range;
    this._components = components;
    this._duration = duration;
    this._classes = classes;
    this._description = description;
    this._higherLevel = higherLevel;
    this._creatorId = creatorId;
    this._visibility = visibility;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  // Business logic methods
  private validateSpellData(data: {
    name?: string;
    level?: number;
    duration?: SpellDuration;
    classes?: string[];
    components?: SpellComponents | undefined;
  }): void {
    if (data.level !== undefined && (data.level < 0 || data.level > 9)) {
      throw new Error("Spell level must be between 0 and 9");
    }

    if (data.classes && data.classes.length === 0) {
      throw new Error("Spell must have at least one class");
    }

    if (data.duration) {
      if (!data.duration.duration) {
        throw new Error("Spell duration must have a duration field");
      }
    }

    if (data.components) {
      const components = data.components;
      if (!components.verbal && !components.somatic && !components.material) {
        throw new Error("Spell must have at least one component type");
      }
    }
  }

  updateBasicInfo(updates: {
    name?: string;
    level?: number;
    school?: SpellSchool;
    castingTime?: string;
    range?: string;
    components?: SpellComponents;
    duration?: SpellDuration;
    classes?: string[];
    description?: string;
    higherLevel?: string;
  }): void {
    this.validateSpellData(updates);
    if (updates.name !== undefined) this._name = updates.name;
    if (updates.level !== undefined) this._level = updates.level;
    if (updates.school !== undefined) this._school = updates.school;
    if (updates.castingTime !== undefined)
      this._castingTime = updates.castingTime;
    if (updates.range !== undefined) this._range = updates.range;
    if (updates.components !== undefined) this._components = updates.components;
    if (updates.duration !== undefined) this._duration = updates.duration;
    if (updates.classes !== undefined) this._classes = updates.classes;
    if (updates.description !== undefined)
      this._description = updates.description;
    if (updates.higherLevel !== undefined)
      this._higherLevel = updates.higherLevel;
    this._updatedAt = new Date();
  }

  canBeAccessedBy(userId?: string): boolean {
    if (this._visibility === "PUBLIC") return true;
    return this._creatorId === userId;
  }

  canBeModifiedBy(userId?: string): boolean {
    return this._creatorId === userId;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get level(): number {
    return this._level;
  }

  get school(): SpellSchool | undefined {
    return this._school;
  }

  get castingTime(): string | undefined {
    return this._castingTime;
  }

  get range(): string | undefined {
    return this._range;
  }

  get components(): SpellComponents | undefined {
    return this._components;
  }

  get duration(): SpellDuration {
    return this._duration;
  }

  get classes(): string[] {
    return [...this._classes];
  }

  get description(): string | undefined {
    return this._description;
  }

  get higherLevel(): string | undefined {
    return this._higherLevel;
  }

  get creatorId(): string | undefined {
    return this._creatorId;
  }

  get visibility(): "PUBLIC" | "PRIVATE" {
    return this._visibility;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
