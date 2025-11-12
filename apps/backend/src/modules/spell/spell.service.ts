import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateSpellDto,
  UpdateSpellDto,
  SpellResponseDto,
  SpellSchool,
} from "./dto";
import { Spell } from "@prisma/client";

@Injectable()
export class SpellService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate spell data
   */
  private validateSpellData(
    data: Partial<CreateSpellDto | UpdateSpellDto>,
  ): void {
    // Validate level
    if (data.level !== undefined && (data.level < 0 || data.level > 9)) {
      throw new BadRequestException("Spell level must be between 0 and 9");
    }

    // Validate classes array
    if (data.classes && data.classes.length === 0) {
      throw new BadRequestException("Spell must have at least one class");
    }

    // Validate duration structure
    if (data.duration) {
      if (!data.duration.duration) {
        throw new BadRequestException(
          "Spell duration must have a duration field",
        );
      }
    }

    // Validate components
    if (data.components) {
      const components = data.components;
      if (!components.verbal && !components.somatic && !components.material) {
        throw new BadRequestException(
          "Spell must have at least one component type",
        );
      }
    }
  }

  /**
   * Create a new spell
   */
  async create(createDto: CreateSpellDto): Promise<SpellResponseDto> {
    this.validateSpellData(createDto);

    // Check if spell with same name already exists
    const existingSpell = await this.prisma.spell.findFirst({
      where: { name: createDto.name },
    });

    if (existingSpell) {
      throw new BadRequestException("Spell with this name already exists");
    }

    const spell = await this.prisma.spell.create({
      data: {
        name: createDto.name,
        level: createDto.level,
        ...(createDto.school !== undefined && { school: createDto.school }),
        ...(createDto.castingTime !== undefined && {
          castingTime: createDto.castingTime,
        }),
        ...(createDto.range !== undefined && { range: createDto.range }),
        ...(createDto.components !== undefined && {
          components: createDto.components,
        }),
        duration: createDto.duration,
        classes: createDto.classes,
        ...(createDto.description !== undefined && {
          description: createDto.description,
        }),
        ...(createDto.higherLevel !== undefined && {
          higherLevel: createDto.higherLevel,
        }),
      },
    });

    return this.mapToResponseDto(spell);
  }

  /**
   * Find all spells with optional filtering
   */
  async findAll(filters?: {
    level?: number;
    school?: SpellSchool;
    class?: string;
    search?: string;
  }): Promise<SpellResponseDto[]> {
    const where: any = {};

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
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const spells = await this.prisma.spell.findMany({
      where,
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    return spells.map((spell: Spell) => this.mapToResponseDto(spell));
  }

  /**
   * Find a single spell by ID
   */
  async findOne(id: string): Promise<SpellResponseDto> {
    const spell = await this.prisma.spell.findUnique({
      where: { id },
    });

    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    return this.mapToResponseDto(spell);
  }

  /**
   * Update a spell
   */
  async update(
    id: string,
    updateDto: UpdateSpellDto,
  ): Promise<SpellResponseDto> {
    this.validateSpellData(updateDto);

    // Check if spell exists
    const existingSpell = await this.prisma.spell.findUnique({
      where: { id },
    });

    if (!existingSpell) {
      throw new NotFoundException("Spell not found");
    }

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== existingSpell.name) {
      const nameConflict = await this.prisma.spell.findFirst({
        where: { name: updateDto.name },
      });
      if (nameConflict) {
        throw new BadRequestException("Spell with this name already exists");
      }
    }

    const updatedSpell = await this.prisma.spell.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.level !== undefined && { level: updateDto.level }),
        ...(updateDto.school !== undefined && { school: updateDto.school }),
        ...(updateDto.castingTime !== undefined && {
          castingTime: updateDto.castingTime,
        }),
        ...(updateDto.range !== undefined && { range: updateDto.range }),
        ...(updateDto.components !== undefined && {
          components: updateDto.components,
        }),
        ...(updateDto.duration !== undefined && {
          duration: updateDto.duration,
        }),
        ...(updateDto.classes !== undefined && { classes: updateDto.classes }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
        ...(updateDto.higherLevel !== undefined && {
          higherLevel: updateDto.higherLevel,
        }),
      },
    });

    return this.mapToResponseDto(updatedSpell);
  }

  /**
   * Delete a spell
   */
  async remove(id: string): Promise<void> {
    const spell = await this.prisma.spell.findUnique({
      where: { id },
    });

    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    // Check if spell is being used by any characters
    const charactersUsingSpell = await this.prisma.character.count({
      where: {
        OR: [{ knownSpells: { has: id } }, { preparedSpells: { has: id } }],
      },
    });

    if (charactersUsingSpell > 0) {
      throw new BadRequestException(
        "Cannot delete spell that is currently known or prepared by characters",
      );
    }

    await this.prisma.spell.delete({
      where: { id },
    });
  }

  /**
   * Import spells from external API
   */
  async importFromSRD(): Promise<{ imported: number; skipped: number }> {
    // This will be implemented later
    throw new BadRequestException("SRD import not yet implemented");
  }

  /**
   * Map Prisma spell to response DTO
   */
  private mapToResponseDto(spell: any): SpellResponseDto {
    return {
      id: spell.id,
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
      createdAt: spell.createdAt,
      updatedAt: spell.updatedAt,
    };
  }
}
