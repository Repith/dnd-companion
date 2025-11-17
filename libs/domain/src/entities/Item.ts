import { ItemType } from "../enums/item-type";
import { Rarity } from "../enums/rarity";

interface ItemProperties {
  damageDice?: string;
  armorClassBonus?: number;
  requiredProficiency?: string;
  attunement?: boolean;
  charges?: number;
  maxCharges?: number;
  [key: string]: any;
}

interface ItemEffects {
  abilityScoreModifiers?: Record<string, number>;
  skillModifiers?: Record<string, number>;
  savingThrowModifiers?: Record<string, number>;
  [key: string]: any;
}

export class Item {
  public readonly id: string;
  private _name: string;
  private _type: ItemType;
  private _rarity: Rarity;
  private _weight: number;
  private _properties: ItemProperties | undefined;
  private _effects: ItemEffects | undefined;
  private _source: string | undefined;
  private _description: string | undefined;
  private _equipped: boolean = false;

  constructor(
    id: string,
    name: string,
    type: ItemType,
    rarity: Rarity,
    weight: number = 0,
    properties?: ItemProperties,
    effects?: ItemEffects,
    source?: string,
    description?: string,
  ) {
    this.validateItemProperties({
      name,
      type,
      rarity,
      weight,
      ...(properties !== undefined && { properties }),
      ...(effects !== undefined && { effects }),
    });
    this.id = id;
    this._name = name;
    this._type = type;
    this._rarity = rarity;
    this._weight = weight;
    this._properties = properties ? { ...properties } : undefined;
    this._effects = effects ? { ...effects } : undefined;
    this._source = source;
    this._description = description;
  }

  get name(): string {
    return this._name;
  }

  get type(): ItemType {
    return this._type;
  }

  get rarity(): Rarity {
    return this._rarity;
  }

  get weight(): number {
    return this._weight;
  }

  get properties(): ItemProperties | undefined {
    return this._properties ? { ...this._properties } : undefined;
  }

  get effects(): ItemEffects | undefined {
    return this._effects ? { ...this._effects } : undefined;
  }

  get source(): string | undefined {
    return this._source;
  }

  get description(): string | undefined {
    return this._description;
  }

  get equipped(): boolean {
    return this._equipped;
  }

  equip(): boolean {
    this._equipped = !this._equipped;
    return this._equipped;
  }

  update(
    updates: Partial<{
      name: string;
      type: ItemType;
      rarity: Rarity;
      weight: number;
      properties: ItemProperties;
      effects: ItemEffects;
      source: string;
      description: string;
    }>,
  ): void {
    this.validateItemProperties(updates);

    if (updates.name !== undefined) this._name = updates.name;
    if (updates.type !== undefined) this._type = updates.type;
    if (updates.rarity !== undefined) this._rarity = updates.rarity;
    if (updates.weight !== undefined) this._weight = updates.weight;
    if (updates.properties !== undefined)
      this._properties = { ...updates.properties };
    if (updates.effects !== undefined) this._effects = { ...updates.effects };
    if (updates.source !== undefined) this._source = updates.source;
    if (updates.description !== undefined)
      this._description = updates.description;
  }

  private validateItemProperties(
    data: Partial<{
      name?: string;
      type?: ItemType;
      rarity?: Rarity;
      weight?: number;
      properties?: ItemProperties;
      effects?: ItemEffects;
    }>,
  ): void {
    // Validate weight
    if (data.weight !== undefined && data.weight < 0) {
      throw new Error("Item weight cannot be negative");
    }

    // Validate properties based on item type
    if (data.properties) {
      const props = data.properties;

      // Weapon validations
      if (data.type === ItemType.WEAPON) {
        if (!props.damageDice) {
          throw new Error("Weapons must have damage dice");
        }
        // Basic damage dice validation (e.g., "1d8", "2d6+3")
        const damageDiceRegex = /^\d+d\d+(\+\d+)?$/;
        if (!damageDiceRegex.test(props.damageDice)) {
          throw new Error("Invalid damage dice format");
        }
      }

      // Armor validations
      if (data.type === ItemType.ARMOR) {
        if (
          props.armorClassBonus !== undefined &&
          (props.armorClassBonus < 0 || props.armorClassBonus > 10)
        ) {
          throw new Error("Armor class bonus must be between 0 and 10");
        }
      }

      // Consumable validations
      if (data.type === ItemType.CONSUMABLE) {
        if (props.charges !== undefined && props.charges < 0) {
          throw new Error("Consumable charges cannot be negative");
        }
        if (props.maxCharges !== undefined && props.maxCharges < 1) {
          throw new Error("Maximum charges must be at least 1");
        }
        if (
          props.charges !== undefined &&
          props.maxCharges !== undefined &&
          props.charges > props.maxCharges
        ) {
          throw new Error("Current charges cannot exceed maximum charges");
        }
      }
    }

    // Validate effects
    if (data.effects) {
      const effects = data.effects;

      // Validate ability score modifiers
      if (effects.abilityScoreModifiers) {
        const validAbilities = [
          "strength",
          "dexterity",
          "constitution",
          "intelligence",
          "wisdom",
          "charisma",
        ];
        for (const [ability, modifier] of Object.entries(
          effects.abilityScoreModifiers,
        )) {
          if (!validAbilities.includes(ability.toLowerCase())) {
            throw new Error(`Invalid ability: ${ability}`);
          }
          if (modifier < -10 || modifier > 10) {
            throw new Error("Ability modifiers must be between -10 and 10");
          }
        }
      }

      // Validate skill modifiers
      if (effects.skillModifiers) {
        for (const [skill, modifier] of Object.entries(
          effects.skillModifiers,
        )) {
          if (modifier < -10 || modifier > 10) {
            throw new Error("Skill modifiers must be between -10 and 10");
          }
        }
      }

      // Validate saving throw modifiers
      if (effects.savingThrowModifiers) {
        const validAbilities = [
          "strength",
          "dexterity",
          "constitution",
          "intelligence",
          "wisdom",
          "charisma",
        ];
        for (const [ability, modifier] of Object.entries(
          effects.savingThrowModifiers,
        )) {
          if (!validAbilities.includes(ability.toLowerCase())) {
            throw new Error(`Invalid ability for saving throw: ${ability}`);
          }
          if (modifier < -10 || modifier > 10) {
            throw new Error(
              "Saving throw modifiers must be between -10 and 10",
            );
          }
        }
      }
    }
  }
}
