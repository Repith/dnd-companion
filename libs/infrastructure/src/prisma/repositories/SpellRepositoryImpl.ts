import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { SpellRepository, SpellFilters } from "@dnd-companion/domain";
import { Spell } from "@dnd-companion/domain";
import { SpellSchool } from "@dnd-companion/domain";

@Injectable()
export class SpellRepositoryImpl implements SpellRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Spell | null> {
    const prismaSpell = await this.prisma.spell.findUnique({
      where: { id },
    });

    if (!prismaSpell) {
      return null;
    }

    return this.mapToDomain(prismaSpell);
  }

  async findByIdWithAccessCheck(
    id: string,
    userId?: string,
  ): Promise<Spell | null> {
    const prismaSpell = await this.prisma.spell.findUnique({
      where: { id },
    });

    if (!prismaSpell) {
      return null;
    }

    const spell = this.mapToDomain(prismaSpell);
    if (!spell.canBeAccessedBy(userId)) {
      return null;
    }

    return spell;
  }

  async findAll(): Promise<Spell[]> {
    const prismaSpells = await this.prisma.spell.findMany();

    return prismaSpells.map((spell) => this.mapToDomain(spell));
  }

  async findAllWithFilters(filters?: SpellFilters): Promise<Spell[]> {
    const where: any = {};

    if (filters?.userId) {
      where.OR = [{ visibility: "PUBLIC" }, { creatorId: filters.userId }];
    } else {
      where.visibility = "PUBLIC";
    }

    if (filters?.level !== undefined) {
      where.level = filters.level;
    }

    if (filters?.school) {
      where.school = filters.school;
    }

    if (filters?.class) {
      where.classes = {
        has: filters.class,
      };
    }

    if (filters?.search) {
      where.AND = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    const prismaSpells = await this.prisma.spell.findMany({
      where,
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    return prismaSpells.map((spell) => this.mapToDomain(spell));
  }

  async findByName(name: string): Promise<Spell | null> {
    const prismaSpell = await this.prisma.spell.findFirst({
      where: { name },
    });

    if (!prismaSpell) {
      return null;
    }

    return this.mapToDomain(prismaSpell);
  }

  async save(spell: Spell): Promise<void> {
    const data = this.mapToPrisma(spell);

    await this.prisma.spell.upsert({
      where: { id: spell.id },
      update: data,
      create: { ...data, id: spell.id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.spell.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.spell.count({
      where: { id },
    });
    return count > 0;
  }

  async countSpellsUsing(id: string): Promise<number> {
    const characterCount = await this.prisma.character.count({
      where: {
        OR: [{ knownSpells: { has: id } }, { preparedSpells: { has: id } }],
      },
    });
    return characterCount;
  }

  private mapToDomain(prismaSpell: any): Spell {
    return new Spell(
      prismaSpell.id,
      prismaSpell.name,
      prismaSpell.level,
      prismaSpell.duration,
      prismaSpell.classes,
      prismaSpell.school,
      prismaSpell.castingTime,
      prismaSpell.range,
      prismaSpell.components,
      prismaSpell.description,
      prismaSpell.higherLevel,
      prismaSpell.creatorId,
      prismaSpell.visibility,
      prismaSpell.createdAt,
      prismaSpell.updatedAt,
    );
  }

  private mapToPrisma(spell: Spell): any {
    return {
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      classes: spell.classes,
      description: spell.description,
      higherLevel: spell.higherLevel,
      creatorId: spell.creatorId,
      visibility: spell.visibility,
      createdAt: spell.createdAt,
      updatedAt: spell.updatedAt,
    };
  }
}
