import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateDiceRollDto, DiceRollResponseDto } from "./dto";

@Injectable()
export class DiceRollService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new dice roll record
   */
  async create(
    createDto: CreateDiceRollDto,
    userId: string,
  ): Promise<DiceRollResponseDto> {
    console.log("DEBUG: Service create called", { createDto, userId });
    // Validate character exists and user has access if characterId is provided
    if (createDto.characterId) {
      console.log("DEBUG: Validating character", createDto.characterId);
      const character = await this.prisma.character.findUnique({
        where: { id: createDto.characterId },
      });

      if (!character) {
        console.log("DEBUG: Character not found");
        throw new NotFoundException("Character not found");
      }

      // Check if user has access to the character (same logic as CharacterService.findAll)
      const hasAccess =
        character.ownerId === userId || character.campaignId !== null;
      if (!hasAccess) {
        console.log(
          "DEBUG: Forbidden access to character - ownerId:",
          character.ownerId,
          "campaignId:",
          character.campaignId,
          "userId:",
          userId,
        );
        throw new ForbiddenException(
          "You do not have access to this character",
        );
      }
      console.log("DEBUG: Character validation passed");
    }

    console.log("DEBUG: Creating dice roll in DB");
    const diceRoll = await this.prisma.diceRoll.create({
      data: {
        userId,
        characterId: createDto.characterId || null,
        diceType: createDto.diceType,
        numberOfDice: createDto.numberOfDice,
        individualResults: createDto.individualResults,
        totalResult: createDto.totalResult,
      },
    });

    console.log("DEBUG: Dice roll created", diceRoll);
    return this.mapToResponseDto(diceRoll);
  }

  /**
   * Find all dice rolls for a user
   */
  async findAll(
    userId: string,
    characterId?: string,
    limit?: number,
  ): Promise<DiceRollResponseDto[]> {
    const where: any = { userId };

    if (characterId) {
      where.characterId = characterId;
    }

    const diceRolls = await this.prisma.diceRoll.findMany({
      where,
      orderBy: { timestamp: "desc" },
      ...(limit && { take: limit }),
    });

    return diceRolls.map((roll) => this.mapToResponseDto(roll));
  }

  /**
   * Find a dice roll by ID
   */
  async findOne(id: string, userId: string): Promise<DiceRollResponseDto> {
    const diceRoll = await this.prisma.diceRoll.findUnique({
      where: { id },
    });

    if (!diceRoll) {
      throw new NotFoundException("Dice roll not found");
    }

    if (diceRoll.userId !== userId) {
      throw new ForbiddenException("You do not have access to this dice roll");
    }

    return this.mapToResponseDto(diceRoll);
  }

  /**
   * Delete a dice roll
   */
  async remove(id: string, userId: string): Promise<void> {
    const diceRoll = await this.prisma.diceRoll.findUnique({
      where: { id },
    });

    if (!diceRoll) {
      throw new NotFoundException("Dice roll not found");
    }

    if (diceRoll.userId !== userId) {
      throw new ForbiddenException("You do not have access to this dice roll");
    }

    await this.prisma.diceRoll.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma dice roll to response DTO
   */
  private mapToResponseDto(diceRoll: any): DiceRollResponseDto {
    return {
      id: diceRoll.id,
      userId: diceRoll.userId,
      characterId: diceRoll.characterId,
      diceType: diceRoll.diceType,
      numberOfDice: diceRoll.numberOfDice,
      individualResults: diceRoll.individualResults,
      totalResult: diceRoll.totalResult,
      timestamp: diceRoll.timestamp,
    };
  }
}
