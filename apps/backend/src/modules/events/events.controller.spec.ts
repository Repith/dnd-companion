import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { EventLoggingService } from "./event-logging.service";
import { EventBusService } from "./event-bus.service";
import { EventType } from "./dto";
import { of } from "rxjs";

describe("EventsController", () => {
  let controller: EventsController;
  let eventLoggingService: EventLoggingService;
  let eventBusService: EventBusService;

  const mockEventLoggingService = {
    queryEvents: jest.fn(),
    getEventStats: jest.fn(),
  };

  const mockEventBusService = {
    getEventObservable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventLoggingService,
          useValue: mockEventLoggingService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventLoggingService = module.get<EventLoggingService>(EventLoggingService);
    eventBusService = module.get<EventBusService>(EventBusService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getEvents", () => {
    it("should return events with query parameters", async () => {
      const query = { sessionId: "session-1", limit: 10 };
      const mockResult = {
        events: [],
        total: 0,
        limit: 10,
        offset: 0,
      };

      mockEventLoggingService.queryEvents.mockResolvedValue(mockResult);

      const result = await controller.getEvents(query);

      expect(mockEventLoggingService.queryEvents).toHaveBeenCalledWith(query);
      expect(result).toBe(mockResult);
    });
  });

  describe("getEventStats", () => {
    it("should return event statistics for session", async () => {
      const sessionId = "session-1";
      const mockStats = {
        totalEvents: 25,
        eventsByType: { [EventType.DAMAGE_APPLIED]: 10 },
        eventsBySession: { [sessionId]: 25 },
        recentEvents: [],
      };

      mockEventLoggingService.getEventStats.mockResolvedValue(mockStats);

      const result = await controller.getEventStats(sessionId);

      expect(mockEventLoggingService.getEventStats).toHaveBeenCalledWith(
        sessionId,
        undefined,
        undefined,
      );
      expect(result).toBe(mockStats);
    });
  });

  describe("getSessionEvents", () => {
    it("should return events for specific session", async () => {
      const sessionId = "session-1";
      const query = { limit: 20 };
      const mockResult = {
        events: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      mockEventLoggingService.queryEvents.mockResolvedValue(mockResult);

      const result = await controller.getSessionEvents(sessionId, query);

      expect(mockEventLoggingService.queryEvents).toHaveBeenCalledWith({
        ...query,
        sessionId,
      });
      expect(result).toBe(mockResult);
    });
  });

  describe("getCharacterEvents", () => {
    it("should return events where character is the actor", async () => {
      const characterId = "char-1";
      const query = { limit: 15 };
      const mockResult = {
        events: [],
        total: 0,
        limit: 15,
        offset: 0,
      };

      mockEventLoggingService.queryEvents.mockResolvedValue(mockResult);

      const result = await controller.getCharacterEvents(characterId, query);

      expect(mockEventLoggingService.queryEvents).toHaveBeenCalledWith({
        ...query,
        actorId: characterId,
      });
      expect(result).toBe(mockResult);
    });
  });

  describe("getSessionEventsSSE", () => {
    it("should return SSE observable for session events", (done) => {
      const sessionId = "session-1";
      const mockEvent = {
        type: EventType.DAMAGE_APPLIED,
        sessionId,
        payload: { damage: 10 },
      };

      const mockObservable = of(mockEvent);
      mockEventBusService.getEventObservable.mockReturnValue(mockObservable);

      const result = controller.getSessionEventsSSE(sessionId);

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: mockEvent });
          expect(mockEventBusService.getEventObservable).toHaveBeenCalledWith(
            undefined,
            { sessionId },
          );
          done();
        },
        error: done,
      });
    });
  });

  describe("getCharacterEventsSSE", () => {
    it("should return SSE observable for character events", (done) => {
      const characterId = "char-1";
      const mockEvent = {
        type: EventType.EXPERIENCE_GAINED,
        targetId: characterId,
        payload: { experienceGained: 100 },
      };

      const mockObservable = of(mockEvent);
      mockEventBusService.getEventObservable.mockReturnValue(mockObservable);

      const result = controller.getCharacterEventsSSE(characterId);

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: mockEvent });
          expect(mockEventBusService.getEventObservable).toHaveBeenCalledWith(
            undefined,
            { targetId: characterId },
          );
          done();
        },
        error: done,
      });
    });
  });

  describe("getCampaignEventsSSE", () => {
    it("should return SSE observable for campaign events", (done) => {
      const campaignId = "campaign-1";
      const mockEvent = {
        type: EventType.QUEST_FINISHED,
        campaignId,
        payload: { questId: "quest-1" },
      };

      const mockObservable = of(mockEvent);
      mockEventBusService.getEventObservable.mockReturnValue(mockObservable);

      const result = controller.getCampaignEventsSSE(campaignId);

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: mockEvent });
          expect(mockEventBusService.getEventObservable).toHaveBeenCalledWith(
            undefined,
            { campaignId },
          );
          done();
        },
        error: done,
      });
    });
  });

  describe("getGlobalEventsSSE", () => {
    it("should return SSE observable for global events", (done) => {
      const mockEvent = {
        type: EventType.USER_LOGGED_IN,
        global: true,
        payload: { userId: "user-1", username: "testuser" },
      };

      const mockObservable = of(mockEvent);
      mockEventBusService.getEventObservable.mockReturnValue(mockObservable);

      const result = controller.getGlobalEventsSSE();

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: mockEvent });
          expect(mockEventBusService.getEventObservable).toHaveBeenCalledWith(
            undefined,
            { global: true },
          );
          done();
        },
        error: done,
      });
    });
  });
});
