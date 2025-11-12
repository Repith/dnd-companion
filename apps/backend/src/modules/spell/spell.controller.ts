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
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SpellService } from "./spell.service";
import { CreateSpellDto, UpdateSpellDto, SpellSchool } from "./dto";

@Controller("spells")
export class SpellController {
  constructor(private readonly spellService: SpellService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSpellDto: CreateSpellDto) {
    try {
      return this.spellService.create(createSpellDto);
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
  findAll(
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

    return this.spellService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.spellService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() updateSpellDto: UpdateSpellDto) {
    try {
      return this.spellService.update(id, updateSpellDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update spell",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.spellService.remove(id);
  }
}
