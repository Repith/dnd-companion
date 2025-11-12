import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EventLoggingService } from "./event-logging.service";
import { EventQueryDto, EventResponseDto, EventStatsDto } from "./dto";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventLoggingService: EventLoggingService) {}

  /**
   * Get events with filtering and pagination
   */
  @Get()
  async getEvents(@Query() query: EventQueryDto): Promise<{
    events: EventResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    this.logger.debug("Getting events", query);
    return this.eventLoggingService.queryEvents(query);
  }

  /**
   * Get event statistics
   */
  @Get("stats")
  async getEventStats(
    @Query("sessionId") sessionId?: string,
  ): Promise<EventStatsDto> {
    this.logger.debug("Getting event stats", { sessionId });
    return this.eventLoggingService.getEventStats(sessionId);
  }

  /**
   * Get events for a specific session
   */
  @Get("session/:sessionId")
  async getSessionEvents(
    @Param("sessionId") sessionId: string,
    @Query() query: Omit<EventQueryDto, "sessionId">,
  ): Promise<{
    events: EventResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    this.logger.debug("Getting session events", { sessionId, ...query });
    return this.eventLoggingService.queryEvents({
      ...query,
      sessionId,
    });
  }

  /**
   * Get events for a specific character
   */
  @Get("character/:characterId")
  async getCharacterEvents(
    @Param("characterId") characterId: string,
    @Query() query: Omit<EventQueryDto, "actorId" | "targetId">,
  ): Promise<{
    events: EventResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    this.logger.debug("Getting character events", { characterId, ...query });
    return this.eventLoggingService.queryEvents({
      ...query,
      actorId: characterId, // Events where character is the actor
    });
  }
}
