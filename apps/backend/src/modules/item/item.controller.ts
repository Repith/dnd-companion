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
import { ItemService } from "./item.service";
import { CreateItemDto, UpdateItemDto, ItemType, Rarity } from "./dto";

@Controller("items")
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createItemDto: CreateItemDto) {
    try {
      return this.itemService.create(createItemDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create item",
      );
    }
  }

  @Get()
  findAll(
    @Query("type") type?: ItemType,
    @Query("rarity") rarity?: Rarity,
    @Query("search") search?: string,
  ) {
    const filters: { type?: ItemType; rarity?: Rarity; search?: string } = {};
    if (type) filters.type = type;
    if (rarity) filters.rarity = rarity;
    if (search) filters.search = search;
    return this.itemService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.itemService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() updateItemDto: UpdateItemDto) {
    try {
      return this.itemService.update(id, updateItemDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update item",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.itemService.remove(id);
  }
}
