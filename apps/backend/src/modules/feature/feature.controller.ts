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
import { FeatureService } from "./feature.service";
import { CreateFeatureDto, UpdateFeatureDto } from "./dto";

@Controller("features")
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createFeatureDto: CreateFeatureDto) {
    try {
      return this.featureService.create(createFeatureDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create feature",
      );
    }
  }

  @Get()
  findAll(
    @Query("level") level?: string,
    @Query("source") source?: string,
    @Query("search") search?: string,
  ) {
    const filters: {
      level?: number;
      source?: string;
      search?: string;
    } = {};

    if (level) {
      const levelNum = parseInt(level, 10);
      if (!isNaN(levelNum)) {
        filters.level = levelNum;
      }
    }

    if (source) filters.source = source;
    if (search) filters.search = search;

    return this.featureService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.featureService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    try {
      return this.featureService.update(id, updateFeatureDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update feature",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.featureService.remove(id);
  }
}
