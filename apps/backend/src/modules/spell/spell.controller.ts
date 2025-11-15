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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SpellService } from "./spell.service";
import { CreateSpellDto, UpdateSpellDto, SpellSchool } from "./dto";
import { AuthenticatedRequest } from "../../common/types";

@Controller("spells")
export class SpellController {
  constructor(private readonly spellService: SpellService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createSpellDto: CreateSpellDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.spellService.create(createSpellDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create spell",
      );
    }
  }

  @Post("import-srd")
  @UseGuards(JwtAuthGuard)
  async importFromSRD() {
    try {
      return await this.spellService.importFromSRD();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to import spells from SRD",
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
    const filters: {
      level?: number;
      school?: SpellSchool;
      class?: string;
      search?: string;
    } = {};

    if (level) {
      const levelNum = parseInt(level, 10);
      if (!isNaN(levelNum)) {
        filters.level = levelNum;
      }
    }

    if (school) filters.school = school;
    if (spellClass) filters.class = spellClass;
    if (search) filters.search = search;

    return this.spellService.findAll(req.user.id, filters);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.spellService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body() updateSpellDto: UpdateSpellDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.spellService.update(id, updateSpellDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update spell",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.spellService.remove(id, req.user.id);
  }
}
