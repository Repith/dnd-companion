import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  Request,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSpellDto, UpdateSpellDto, SpellSchool } from "./dto";
import { AuthenticatedRequest } from "../../common/types";
import {
  CreateSpellCommand,
  UpdateSpellCommand,
  DeleteSpellCommand,
  GetSpellQuery,
  GetSpellsQuery,
} from "@dnd-companion/application";

@Controller("spells")
export class SpellController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createSpellDto: CreateSpellDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const command = new CreateSpellCommand(
        createSpellDto.name,
        createSpellDto.level,
        createSpellDto.duration,
        createSpellDto.classes,
        createSpellDto.school,
        createSpellDto.castingTime,
        createSpellDto.range,
        createSpellDto.components,
        createSpellDto.description,
        createSpellDto.higherLevel,
        req.user.id,
      );

      const spellId = await this.commandBus.execute(command);
      const query = new GetSpellQuery(spellId, req.user.id);
      return this.queryBus.execute(query);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create spell",
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query("level") level?: string,
    @Query("school") school?: SpellSchool,
    @Query("class") spellClass?: string,
    @Query("search") search?: string,
  ) {
    const query = new GetSpellsQuery(
      level ? parseInt(level, 10) : undefined,
      school,
      spellClass,
      search,
      req.user.id,
    );

    return this.queryBus.execute(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const query = new GetSpellQuery(id, req.user.id);
    return this.queryBus.execute(query);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updateSpellDto: UpdateSpellDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const command = new UpdateSpellCommand(
        id,
        updateSpellDto.name,
        updateSpellDto.level,
        updateSpellDto.school,
        updateSpellDto.castingTime,
        updateSpellDto.range,
        updateSpellDto.components,
        updateSpellDto.duration,
        updateSpellDto.classes,
        updateSpellDto.description,
        updateSpellDto.higherLevel,
        req.user.id,
      );

      await this.commandBus.execute(command);
      const query = new GetSpellQuery(id, req.user.id);
      return this.queryBus.execute(query);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update spell",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const command = new DeleteSpellCommand(id, req.user.id);
    return this.commandBus.execute(command);
  }
}
