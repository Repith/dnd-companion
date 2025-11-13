import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DiceRollService } from "./dice-roll.service";
import { CreateDiceRollDto } from "./dto";
import { AuthenticatedRequest } from "../../common/types";

@Controller("dice-rolls")
@UseGuards(JwtAuthGuard)
export class DiceRollController {
  constructor(private readonly diceRollService: DiceRollService) {}

  @Post()
  create(
    @Body() createDiceRollDto: CreateDiceRollDto,
    @Request() req: AuthenticatedRequest,
  ) {
    console.log("DEBUG: Backend create called", {
      dto: createDiceRollDto,
      userId: req.user.id,
    });
    try {
      const result = this.diceRollService.create(
        createDiceRollDto,
        req.user.id,
      );
      console.log("DEBUG: Backend create result", result);
      return result;
    } catch (error) {
      console.error("DEBUG: Backend create error", error);
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create dice roll",
      );
    }
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query("characterId") characterId?: string,
    @Query("limit") limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    return this.diceRollService.findAll(req.user.id, characterId, limitNumber);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.diceRollService.findOne(id, req.user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    try {
      return this.diceRollService.remove(id, req.user.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to delete dice roll",
      );
    }
  }
}
