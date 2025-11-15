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
import { ItemService } from "./item.service";
import { CreateItemDto, UpdateItemDto, ItemType, Rarity } from "./dto";
import { AuthenticatedRequest } from "../../common/types";

@Controller("items")
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createItemDto: CreateItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.itemService.create(createItemDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create item",
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query("type") type?: ItemType,
    @Query("rarity") rarity?: Rarity,
    @Query("search") search?: string,
  ) {
    const filters: { type?: ItemType; rarity?: Rarity; search?: string } = {};
    if (type) filters.type = type;
    if (rarity) filters.rarity = rarity;
    if (search) filters.search = search;
    return this.itemService.findAll(req.user.id, filters);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.itemService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.itemService.update(id, updateItemDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update item",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.itemService.remove(id, req.user.id);
  }
}
