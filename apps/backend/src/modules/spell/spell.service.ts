import { Injectable, BadRequestException } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateSpellDto, UpdateSpellDto, SpellResponseDto } from "./dto";
import { SpellSchool } from "@dnd-companion/domain";
import { CreateSpellCommand } from "@dnd-companion/application";
import { UpdateSpellCommand } from "@dnd-companion/application";
import { DeleteSpellCommand } from "@dnd-companion/application";
import { GetSpellQuery } from "@dnd-companion/application";
import { GetSpellsQuery } from "@dnd-companion/application";

@Injectable()
export class SpellService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new spell
   */
  async create(
    createDto: CreateSpellDto,
    userId: string,
  ): Promise<SpellResponseDto> {
    const command = new CreateSpellCommand(
      createDto.name,
      createDto.level,
      createDto.duration,
      createDto.classes,
      createDto.school,
      createDto.castingTime,
      createDto.range,
      createDto.components,
      createDto.description,
      createDto.higherLevel,
      userId,
    );

    const spellId = await this.commandBus.execute(command);
    const query = new GetSpellQuery(spellId, userId);
    return this.queryBus.execute(query);
  }

  /**
   * Find all spells with optional filtering
   */
  async findAll(
    userId: string,
    filters?: {
      level?: number;
      school?: SpellSchool;
      class?: string;
      search?: string;
    },
  ): Promise<SpellResponseDto[]> {
    const query = new GetSpellsQuery(
      filters?.level,
      filters?.school,
      filters?.class,
      filters?.search,
      userId,
    );

    return this.queryBus.execute(query);
  }

  /**
   * Find a single spell by ID
   */
  async findOne(id: string, userId: string): Promise<SpellResponseDto> {
    const query = new GetSpellQuery(id, userId);
    return this.queryBus.execute(query);
  }

  /**
   * Update a spell
   */
  async update(
    id: string,
    updateDto: UpdateSpellDto,
    userId: string,
  ): Promise<SpellResponseDto> {
    const command = new UpdateSpellCommand(
      id,
      updateDto.name,
      updateDto.level,
      updateDto.school,
      updateDto.castingTime,
      updateDto.range,
      updateDto.components,
      updateDto.duration,
      updateDto.classes,
      updateDto.description,
      updateDto.higherLevel,
      userId,
    );

    await this.commandBus.execute(command);
    const query = new GetSpellQuery(id, userId);
    return this.queryBus.execute(query);
  }

  /**
   * Delete a spell
   */
  async remove(id: string, userId: string): Promise<void> {
    const command = new DeleteSpellCommand(id, userId);
    await this.commandBus.execute(command);
  }
}
