import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
  Sse,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EventLoggingService } from "./event-logging.service";
import { EventBusService } from "./event-bus.service";
import { EventQueryDto, EventResponseDto, EventStatsDto } from "./dto";
import { Observable, map } from "rxjs";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventLoggingService: EventLoggingService,
    private readonly eventBusService: EventBusService,
  ) {}

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

  /**
   * SSE endpoint for real-time session events
   */
  @Sse("character/:characterId/stream")
  @UseGuards(JwtAuthGuard)
  getSessionEventsSSE(
    @Param("sessionId") sessionId: string,
  ): Observable<{ data: any }> {
    this.logger.debug("SSE subscription for session events", { sessionId });
    return this.eventBusService
      .getEventObservable(undefined, { sessionId })
      .pipe(map((event) => ({ data: event })));
  }

  /**
   * SSE endpoint for real-time character events
   */
  @Sse("character/:characterId/stream")
  @UseGuards(JwtAuthGuard)
  getCharacterEventsSSE(
    @Param("characterId") characterId: string,
  ): Observable<{ data: any }> {
    this.logger.debug("SSE subscription for character events", { characterId });
    return this.eventBusService
      .getEventObservable(undefined, { targetId: characterId })
      .pipe(map((event) => ({ data: event })));
  }

  /**
   * SSE endpoint for real-time campaign events
   */
  @Sse("campaign/:campaignId/stream")
  @UseGuards(JwtAuthGuard)
  getCampaignEventsSSE(
    @Param("campaignId") campaignId: string,
  ): Observable<{ data: any }> {
    this.logger.debug("SSE subscription for campaign events", { campaignId });
    return this.eventBusService
      .getEventObservable(undefined, { sessionId: campaignId })
      .pipe(map((event) => ({ data: event })));
  }
}
