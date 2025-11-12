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
  Request,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InventoryService } from "./inventory.service";
import { AddItemDto, UpdateInventoryItemDto, EquipItemDto } from "./dto";
import { AuthenticatedRequest } from "../../common/types";

@Controller("inventories")
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.inventoryService.findOne(id, req.user.id);
  }

  @Get("character/:characterId")
  getCharacterInventory(
    @Param("characterId") characterId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.getCharacterInventory(
      characterId,
      req.user.id,
    );
  }

  @Post(":id/items")
  addItem(
    @Param("id") id: string,
    @Body() addItemDto: AddItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.inventoryService.addItem(id, addItemDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to add item",
      );
    }
  }

  @Delete(":id/items/:itemId")
  removeItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Query("quantity") quantity: number,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.inventoryService.removeItem(
        id,
        itemId,
        quantity,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to remove item",
      );
    }
  }

  @Patch(":id/items/:itemId")
  updateItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() updateDto: UpdateInventoryItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.inventoryService.updateItem(
        id,
        itemId,
        updateDto,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update item",
      );
    }
  }

  @Patch(":id/items/:itemId/equip")
  equipItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() equipDto: EquipItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return this.inventoryService.equipItem(id, itemId, equipDto, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to equip/unequip item",
      );
    }
  }
}
