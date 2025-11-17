export class Currency {
  public readonly gold: number;
  public readonly silver: number;
  public readonly copper: number;

  constructor(gold: number = 0, silver: number = 0, copper: number = 0) {
    this.validateAmount(gold);
    this.validateAmount(silver);
    this.validateAmount(copper);
    this.gold = gold;
    this.silver = silver;
    this.copper = copper;
  }

  private validateAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(
        `Currency amount must be a non-negative integer, got ${amount}`,
      );
    }
  }

  public add(other: Currency): Currency {
    return new Currency(
      this.gold + other.gold,
      this.silver + other.silver,
      this.copper + other.copper,
    );
  }

  public subtract(other: Currency): Currency {
    const newGold = this.gold - other.gold;
    const newSilver = this.silver - other.silver;
    const newCopper = this.copper - other.copper;
    if (newGold < 0 || newSilver < 0 || newCopper < 0) {
      throw new Error("Insufficient currency for subtraction");
    }
    return new Currency(newGold, newSilver, newCopper);
  }

  public getTotalCopper(): number {
    return this.gold * 100 + this.silver * 10 + this.copper;
  }

  public toString(): string {
    return `${this.gold}g ${this.silver}s ${this.copper}c`;
  }
}
