export class HitPoints {
  public readonly current: number;
  public readonly max: number;

  constructor(current: number, max: number) {
    this.validateHp(current);
    this.validateHp(max);
    if (current > max) {
      throw new Error(`Current HP (${current}) cannot exceed max HP (${max})`);
    }
    this.current = current;
    this.max = max;
  }

  private validateHp(hp: number): void {
    if (!Number.isInteger(hp) || hp < 0) {
      throw new Error(`HP must be a non-negative integer, got ${hp}`);
    }
  }

  public takeDamage(amount: number): HitPoints {
    if (amount < 0) {
      throw new Error(`Damage amount must be non-negative, got ${amount}`);
    }
    const newCurrent = Math.max(0, this.current - amount);
    return new HitPoints(newCurrent, this.max);
  }

  public heal(amount: number): HitPoints {
    if (amount < 0) {
      throw new Error(`Heal amount must be non-negative, got ${amount}`);
    }
    const newCurrent = Math.min(this.max, this.current + amount);
    return new HitPoints(newCurrent, this.max);
  }

  public isAlive(): boolean {
    return this.current > 0;
  }
}
