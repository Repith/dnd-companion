import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CharacterRepository } from "@dnd-companion/domain";
import { Character } from "@dnd-companion/domain";
import {
  Race,
  CharacterClass,
  Alignment,
  AbilityName,
  SkillName,
} from "@dnd-companion/domain";
import { AbilityScores } from "@dnd-companion/domain";
import { HitPoints } from "@dnd-companion/domain";
import { SkillProficiency } from "@dnd-companion/domain";

@Injectable()
export class CharacterRepositoryImpl implements CharacterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Character | null> {
    const prismaCharacter = await this.prisma.character.findUnique({
      where: { id },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    if (!prismaCharacter) {
      return null;
    }

    return this.mapToDomain(prismaCharacter);
  }

  async save(character: Character): Promise<void> {
    const data = this.mapToPrisma(character);

    await this.prisma.character.upsert({
      where: { id: character.id },
      update: data,
      create: { ...data, id: character.id },
    });
  }

  async updateLevel(
    id: string,
    level: number,
    proficiencyBonus: number,
  ): Promise<void> {
    await this.prisma.character.update({
      where: { id },
      data: {
        level,
        proficiencyBonus,
      },
    });
  }

  async updateExperience(id: string, experiencePoints: number): Promise<void> {
    await this.prisma.character.update({
      where: { id },
      data: {
        experiencePoints,
      },
    });
  }

  async findAll(): Promise<Character[]> {
    const prismaCharacters = await this.prisma.character.findMany({
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return prismaCharacters.map((c) => this.mapToDomain(c));
  }

  async findByIdWithAccessCheck(
    id: string,
    userId?: string,
  ): Promise<Character | null> {
    const prismaCharacter = await this.prisma.character.findUnique({
      where: { id },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    if (!prismaCharacter) {
      return null;
    }

    // Check access
    if (prismaCharacter.ownerId && prismaCharacter.ownerId !== userId) {
      return null;
    }

    return this.mapToDomain(prismaCharacter);
  }

  async findAllForUser(userId: string): Promise<Character[]> {
    const prismaCharacters = await this.prisma.character.findMany({
      where: { ownerId: userId },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return prismaCharacters.map((c) => this.mapToDomain(c));
  }

  async findDemoCharacters(): Promise<Character[]> {
    const prismaCharacters = await this.prisma.character.findMany({
      where: { ownerId: null },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return prismaCharacters.map((c) => this.mapToDomain(c));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.character.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaCharacter: any): Character {
    // Map ability scores
    const abilityScores = prismaCharacter.abilityScores
      ? new AbilityScores(
          prismaCharacter.abilityScores.strength,
          prismaCharacter.abilityScores.dexterity,
          prismaCharacter.abilityScores.constitution,
          prismaCharacter.abilityScores.intelligence,
          prismaCharacter.abilityScores.wisdom,
          prismaCharacter.abilityScores.charisma,
        )
      : new AbilityScores(10, 10, 10, 10, 10, 10); // Default scores

    // Map hit points
    const hitPointsData = prismaCharacter.hitPoints as any;
    const hitPoints = new HitPoints(
      hitPointsData?.current || 10,
      hitPointsData?.max || 10,
    );

    // Map skill proficiencies
    const skillProficiencies =
      prismaCharacter.skillProficiencies?.map((sp: any) => {
        let bonus = 0;
        if (sp.proficient) bonus += 2; // Assuming proficiency bonus of 2
        if (sp.expertise) bonus += 2;
        return new SkillProficiency(sp.skill as SkillName, bonus);
      }) || [];

    // Use primary class from multiclasses or fallback to primaryClass
    const characterClass =
      (prismaCharacter.multiclasses?.[0]?.class as CharacterClass) ||
      (prismaCharacter.primaryClass as CharacterClass) ||
      CharacterClass.FIGHTER;

    return new Character(
      prismaCharacter.id,
      prismaCharacter.name,
      prismaCharacter.race as Race,
      characterClass,
      prismaCharacter.level || 1,
      abilityScores,
      hitPoints,
      (prismaCharacter.alignment as Alignment) || Alignment.TRUE_NEUTRAL,
      skillProficiencies,
    );
  }

  private mapToPrisma(character: Character): any {
    return {
      name: character.name,
      race: character.race,
      primaryClass: character.characterClass,
      level: character.level,
      alignment: character.alignment,
      abilityScores: {
        upsert: {
          create: {
            strength: character.abilityScores.strength,
            dexterity: character.abilityScores.dexterity,
            constitution: character.abilityScores.constitution,
            intelligence: character.abilityScores.intelligence,
            wisdom: character.abilityScores.wisdom,
            charisma: character.abilityScores.charisma,
          },
          update: {
            strength: character.abilityScores.strength,
            dexterity: character.abilityScores.dexterity,
            constitution: character.abilityScores.constitution,
            intelligence: character.abilityScores.intelligence,
            wisdom: character.abilityScores.wisdom,
            charisma: character.abilityScores.charisma,
          },
        },
      },
      hitPoints: {
        max: character.hitPoints.max,
        current: character.hitPoints.current,
        temporary: 0,
      },
      skillProficiencies: {
        deleteMany: {},
        create: character.skillProficiencies.map((sp) => ({
          skill: sp.skillName,
          proficient: sp.bonus >= 2,
          expertise: sp.bonus >= 4,
        })),
      },
    };
  }
}
