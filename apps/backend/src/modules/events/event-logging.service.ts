import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "./event-bus.service";
import { GameEvent, EventType } from "./dto";

/**
 * Service responsible for logging events to the database
 * Automatically subscribes to all events and persists them
 */
@Injectable()
export class EventLoggingService implements OnModuleInit {
  private readonly logger = new Logger(EventLoggingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Initialize event logging on module startup
   */
  async onModuleInit() {
    // Subscribe to all event types
    Object.values(EventType).forEach((eventType) => {
      this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
    });

    this.logger.log(
      "Event logging service initialized and subscribed to all events",
    );
  }

  /**
   * Handle incoming events and persist them to database
   */
  private async handleEvent(event: GameEvent): Promise<void> {
    try {
      // Convert GameEvent to Prisma GameEvent format
      const dbEvent = {
        type: event.type,
        timestamp: event.timestamp || new Date(),
        actorId: event.actorId ?? null,
        targetId: event.targetId ?? null,
        payload: event.payload || {},
        sessionId: event.sessionId ?? null,
        campaignId: event.campaignId ?? null,
        global: event.global ?? false,
      };

      await this.prisma.gameEvent.create({
        data: dbEvent,
      });

      this.logger.debug(`Logged event: ${event.type}`, {
        eventId: event.id,
        actorId: event.actorId,
        targetId: event.targetId,
        sessionId: event.sessionId,
      });
    } catch (error) {
      this.logger.error(`Failed to log event: ${event.type}`, error);
    }
  }

  /**
   * Query events with filtering and pagination
   */
  async queryEvents(query: {
    type?: EventType;
    actorId?: string;
    targetId?: string;
    sessionId?: string;
    campaignId?: string;
    global?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }
    if (query.targetId) {
      where.targetId = query.targetId;
    }
    if (query.sessionId) {
      where.sessionId = query.sessionId;
    }
    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }
    if (query.global !== undefined) {
      where.global = query.global;
    }
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = query.startDate;
      }
      if (query.endDate) {
        where.timestamp.lte = query.endDate;
      }
    }

    const limit = query.limit ? Number(query.limit) : 50;
    const offset = query.offset ? Number(query.offset) : 0;

    const events = await this.prisma.gameEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: {
        actor: {
          select: { id: true, name: true },
        },
        target: {
          select: { id: true, name: true },
        },
        session: {
          select: { id: true, date: true },
        },
      },
    });

    const total = await this.prisma.gameEvent.count({ where });

    return {
      events,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get event statistics
   */
  async getEventStats(
    sessionId?: string,
    campaignId?: string,
    global?: boolean,
  ) {
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (campaignId) where.campaignId = campaignId;
    if (global !== undefined) where.global = global;

    const [totalEvents, eventsByType, eventsBySession] = await Promise.all([
      this.prisma.gameEvent.count({ where }),
      this.prisma.gameEvent.groupBy({
        by: ["type"],
        where,
        _count: { type: true },
      }),
      this.prisma.gameEvent.groupBy({
        by: ["sessionId"],
        where,
        _count: { id: true },
      }),
    ]);

    const recentEvents = await this.prisma.gameEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 10,
      include: {
        actor: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
    });

    return {
      totalEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<EventType, number>),
      eventsBySession: eventsBySession.reduce((acc, item) => {
        if (
          item.sessionId &&
          typeof item._count === "object" &&
          item._count.id
        ) {
          acc[item.sessionId] = item._count.id;
        }
        return acc;
      }, {} as Record<string, number>),
      recentEvents,
    };
  }

  /**
   * Delete old events (for cleanup)
   */
  async deleteOldEvents(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.gameEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Deleted ${result.count} events older than ${olderThanDays} days`,
    );
    return result.count;
  }
}
