export class DiceRollResponseDto {
  id!: string;
  userId!: string;
  characterId?: string;
  diceType!: string;
  numberOfDice!: number;
  individualResults!: number[];
  totalResult!: number;
  timestamp!: Date;
}
