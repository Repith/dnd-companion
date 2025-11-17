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
import { Rarity } from "@dnd-companion/domain";
import { CreateItemDto, UpdateItemDto, ItemType } from "./dto";
import { AuthenticatedRequest } from "../../common/types";

// Temporary inline command classes until application lib is built
class CreateItemCommand {
  constructor(
    public readonly name: string,
    public readonly type: ItemType,
    public readonly rarity: Rarity,
    public readonly weight: number,
    public readonly properties?: any,
    public readonly effects?: any,
    public readonly source?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}

class UpdateItemCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly weight?: number,
    public readonly properties?: any,
    public readonly effects?: any,
    public readonly source?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}

class DeleteItemCommand {
  constructor(public readonly id: string, public readonly userId?: string) {}
}

class GetItemQuery {
  constructor(public readonly id: string, public readonly userId?: string) {}
}

class GetItemsQuery {
  constructor(
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly search?: string,
    public readonly userId?: string,
  ) {}
}

@Controller("items")
export class ItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createItemDto: CreateItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const command = new CreateItemCommand(
        createItemDto.name,
        createItemDto.type,
        createItemDto.rarity || Rarity.COMMON,
        createItemDto.weight || 0,
        createItemDto.properties,
        createItemDto.effects,
        createItemDto.source,
        createItemDto.description,
        req.user.id,
      );

      const itemId = await this.commandBus.execute(command);
      const query = new GetItemQuery(itemId, req.user.id);
      return this.queryBus.execute(query);
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
    const query = new GetItemsQuery(type, rarity, search, req.user.id);
    return this.queryBus.execute(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const query = new GetItemQuery(id, req.user.id);
    return this.queryBus.execute(query);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const command = new UpdateItemCommand(
        id,
        updateItemDto.name,
        updateItemDto.type,
        updateItemDto.rarity,
        updateItemDto.weight,
        updateItemDto.properties,
        updateItemDto.effects,
        updateItemDto.source,
        updateItemDto.description,
        req.user.id,
      );

      await this.commandBus.execute(command);
      const query = new GetItemQuery(id, req.user.id);
      return this.queryBus.execute(query);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update item",
      );
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const command = new DeleteItemCommand(id, req.user.id);
    return this.commandBus.execute(command);
  }
}
