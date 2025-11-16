import { Test, TestingModule } from "@nestjs/testing";
import { EventLoggingService } from "./event-logging.service";
import { EventBusService } from "./event-bus.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventType } from "./dto";

describe("EventLoggingService", () => {
  let service: EventLoggingService;
  let prismaService: PrismaService;
  let eventBusService: EventBusService;

  const mockPrismaService = {
    gameEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockEventBusService = {
    subscribe: jest.fn(),
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventLoggingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    service = module.get<EventLoggingService>(EventLoggingService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventBusService = module.get<EventBusService>(EventBusService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should subscribe to all event types", async () => {
      await service.onModuleInit();

      // Should subscribe to all EventType enum values
      const eventTypes = Object.values(EventType);
      expect(mockEventBusService.subscribe).toHaveBeenCalledTimes(
        eventTypes.length,
      );

      eventTypes.forEach((eventType) => {
        expect(mockEventBusService.subscribe).toHaveBeenCalledWith(
          eventType,
          expect.any(Function),
        );
      });
    });
  });

  describe("handleEvent", () => {
    it("should log event with sessionId context", async () => {
      const gameEvent = {
        type: EventType.DAMAGE_APPLIED,
        actorId: "user-1",
        targetId: "char-1",
        sessionId: "session-1",
        campaignId: "campaign-1",
        global: false,
        payload: { damage: 10 },
        timestamp: new Date(),
      };

      await (service as any).handleEvent(gameEvent);

      expect(mockPrismaService.gameEvent.create).toHaveBeenCalledWith({
        data: {
          type: EventType.DAMAGE_APPLIED,
          timestamp: gameEvent.timestamp,
          actorId: "user-1",
          targetId: "char-1",
          payload: { damage: 10 },
          sessionId: "session-1",
          campaignId: "campaign-1",
          global: false,
        },
      });
    });

    it("should log event with campaignId context", async () => {
      const gameEvent = {
        type: EventType.EXPERIENCE_GAINED,
        targetId: "char-1",
        campaignId: "campaign-1",
        global: false,
        payload: { experienceGained: 100, totalExperience: 500 },
      };

      await (service as any).handleEvent(gameEvent);

      expect(mockPrismaService.gameEvent.create).toHaveBeenCalledWith({
        data: {
          type: EventType.EXPERIENCE_GAINED,
          timestamp: expect.any(Date),
          actorId: null,
          targetId: "char-1",
          payload: { experienceGained: 100, totalExperience: 500 },
          sessionId: null,
          campaignId: "campaign-1",
          global: false,
        },
      });
    });

    it("should log global event", async () => {
      const gameEvent = {
        type: EventType.LEVEL_UP,
        targetId: "char-1",
        global: true,
        payload: { newLevel: 3, oldLevel: 2 },
      };

      await (service as any).handleEvent(gameEvent);

      expect(mockPrismaService.gameEvent.create).toHaveBeenCalledWith({
        data: {
          type: EventType.LEVEL_UP,
          timestamp: expect.any(Date),
          actorId: null,
          targetId: "char-1",
          payload: { newLevel: 3, oldLevel: 2 },
          sessionId: null,
          campaignId: null,
          global: true,
        },
      });
    });

    it("should handle null actorId and targetId", async () => {
      const gameEvent = {
        type: EventType.DICE_ROLL,
        payload: { result: 15, notation: "1d20" },
        sessionId: "session-1",
      };

      await (service as any).handleEvent(gameEvent);

      expect(mockPrismaService.gameEvent.create).toHaveBeenCalledWith({
        data: {
          type: EventType.DICE_ROLL,
          timestamp: expect.any(Date),
          actorId: null,
          targetId: null,
          payload: { result: 15, notation: "1d20" },
          sessionId: "session-1",
          campaignId: null,
          global: false,
        },
      });
    });
  });

  describe("queryEvents", () => {
    it("should query events with sessionId filter", async () => {
      const mockEvents = [
        {
          id: "event-1",
          type: EventType.DAMAGE_APPLIED,
          sessionId: "session-1",
          actor: { id: "user-1", name: "User 1" },
          target: { id: "char-1", name: "Character 1" },
        },
      ];

      mockPrismaService.gameEvent.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.gameEvent.count.mockResolvedValue(1);

      const result = await service.queryEvents({ sessionId: "session-1" });

      expect(mockPrismaService.gameEvent.findMany).toHaveBeenCalledWith({
        where: { sessionId: "session-1" },
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
        include: {
          actor: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } },
          session: { select: { id: true, date: true } },
        },
      });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should query events with campaignId filter", async () => {
      const mockEvents = [
        {
          id: "event-1",
          type: EventType.EXPERIENCE_GAINED,
          campaignId: "campaign-1",
        },
      ];

      mockPrismaService.gameEvent.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.gameEvent.count.mockResolvedValue(1);

      const result = await service.queryEvents({ campaignId: "campaign-1" });

      expect(mockPrismaService.gameEvent.findMany).toHaveBeenCalledWith({
        where: { campaignId: "campaign-1" },
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
        include: {
          actor: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } },
          session: { select: { id: true, date: true } },
        },
      });
    });

    it("should query global events", async () => {
      const mockEvents = [
        {
          id: "event-1",
          type: EventType.LEVEL_UP,
          global: true,
        },
      ];

      mockPrismaService.gameEvent.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.gameEvent.count.mockResolvedValue(1);

      const result = await service.queryEvents({ global: true });

      expect(mockPrismaService.gameEvent.findMany).toHaveBeenCalledWith({
        where: { global: true },
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
        include: {
          actor: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } },
          session: { select: { id: true, date: true } },
        },
      });
    });

    it("should apply date range filters", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      mockPrismaService.gameEvent.findMany.mockResolvedValue([]);
      mockPrismaService.gameEvent.count.mockResolvedValue(0);

      await service.queryEvents({ startDate, endDate });

      const callArgs = mockPrismaService.gameEvent.findMany.mock.calls[0][0];
      expect(callArgs.where.timestamp).toBeDefined();
      expect(callArgs.where.timestamp.gte).toBe(startDate);
      expect(callArgs.where.timestamp.lte).toBe(endDate);
    });
  });

  describe("getEventStats", () => {
    it("should return event statistics with sessionId filter", async () => {
      const mockEventsByType = [
        { type: EventType.DAMAGE_APPLIED, _count: { type: 5 } },
        { type: EventType.HEALING_RECEIVED, _count: { type: 3 } },
      ];

      const mockEventsBySession = [
        { sessionId: "session-1", _count: { id: 8 } },
      ];

      const mockEventsByCampaign = [
        { campaignId: "campaign-1", _count: { id: 8 } },
      ];

      const mockRecentEvents = [
        { type: EventType.DAMAGE_APPLIED, actor: { name: "User 1" } },
      ];

      mockPrismaService.gameEvent.count.mockResolvedValue(10);
      mockPrismaService.gameEvent.groupBy
        .mockResolvedValueOnce(mockEventsByType)
        .mockResolvedValueOnce(mockEventsBySession)
        .mockResolvedValueOnce(mockEventsByCampaign);
      mockPrismaService.gameEvent.findMany.mockResolvedValue(mockRecentEvents);

      const result = await service.getEventStats("session-1");

      expect(result.totalEvents).toBe(10);
      expect(result.eventsByType[EventType.DAMAGE_APPLIED]).toBe(5);
      expect(result.eventsByType[EventType.HEALING_RECEIVED]).toBe(3);
      expect(result.eventsBySession["session-1"]).toBe(8);
      expect(result.eventsByCampaign["campaign-1"]).toBe(8);
      expect(result.recentEvents).toHaveLength(1);
    });

    it("should return global event statistics", async () => {
      mockPrismaService.gameEvent.count.mockResolvedValue(5);
      mockPrismaService.gameEvent.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.gameEvent.findMany.mockResolvedValue([]);

      const result = await service.getEventStats(undefined, undefined, true);

      expect(result.totalEvents).toBe(5);
      expect(result.eventsByCampaign).toEqual({});
    });
  });
});
