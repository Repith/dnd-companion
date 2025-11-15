import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
  ForbiddenException,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { AuthenticatedRequest } from "../../common/types";
import { SessionService } from "./session.service";
import {
  CreateSessionDto,
  SessionResponseDto,
  CreateEventDto,
  EventResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth";
import { RollDiceCommand } from "./commands/roll-dice.command";

@Controller("campaigns/:campaignId/sessions")
@UsePipes(new ValidationPipe({ transform: true }))
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param("campaignId") campaignId: string,
    @Body() createDto: CreateSessionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    return this.sessionService.create(createDto, campaignId, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto[]> {
    return this.sessionService.findAll(campaignId, req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionService.findById(id, req.user.id);
    if (!session) {
      throw new Error("Session not found");
    }
    return session;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updateDto: Partial<CreateSessionDto>,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    return this.sessionService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.sessionService.delete(id, req.user.id);
  }

  @Post(":id/events")
  @UseGuards(JwtAuthGuard)
  async logEvent(
    @Param("id") sessionId: string,
    @Body() eventDto: CreateEventDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<EventResponseDto> {
    return this.sessionService.logEvent(sessionId, eventDto, req.user.id);
  }

  @Get(":id/events")
  @UseGuards(JwtAuthGuard)
  async getEvents(
    @Param("id") sessionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<EventResponseDto[]> {
    return this.sessionService.getEvents(sessionId, req.user.id);
  }

  @Post(":id/adjust-hp")
  @UseGuards(JwtAuthGuard)
  async adjustHP(
    @Param("id") sessionId: string,
    @Body() body: { characterId: string; hpAdjustment: number },
    @Request() req: AuthenticatedRequest,
  ): Promise<EventResponseDto> {
    return this.sessionService.adjustHP(
      sessionId,
      body.characterId,
      body.hpAdjustment,
      req.user.id,
    );
  }

  @Post(":id/grant-item")
  @UseGuards(JwtAuthGuard)
  async grantItem(
    @Param("id") sessionId: string,
    @Body() body: { characterId: string; itemId: string; quantity?: number },
    @Request() req: AuthenticatedRequest,
  ): Promise<EventResponseDto> {
    return this.sessionService.grantItem(
      sessionId,
      body.characterId,
      body.itemId,
      body.quantity || 1,
      req.user.id,
    );
  }

  @Post(":id/rolls")
  @UseGuards(JwtAuthGuard)
  async rollDice(
    @Param("id") sessionId: string,
    @Body()
    body: {
      notation: string;
      result: number;
      label?: string;
      characterId?: string;
      individualResults?: number[];
    },
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const command = new RollDiceCommand(
      body.notation,
      body.result,
      body.label,
      body.characterId,
      body.individualResults,
      sessionId,
    );

    await this.commandBus.execute(command);
  }
}
