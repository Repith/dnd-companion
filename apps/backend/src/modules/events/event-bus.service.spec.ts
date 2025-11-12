import { Test, TestingModule } from "@nestjs/testing";
import { EventBusService } from "./event-bus.service";
import { EventType, GameEvent, EventHandler } from "./dto";

describe("EventBusService", () => {
  let service: EventBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventBusService],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
  });

  afterEach(() => {
    service.clearHandlers();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("publish", () => {
    it("should publish events successfully", async () => {
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
        sessionId: "session-1",
      };

      await expect(service.publish(event)).resolves.toBeUndefined();
    });

    it("should set timestamp if not provided", async () => {
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      await service.publish(event);
      expect(event.timestamp).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("subscribe and publish", () => {
    it("should call subscribed handlers when event is published", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler);
      await service.publish(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should call multiple handlers for the same event type", async () => {
      const mockHandler1 = jest.fn().mockResolvedValue(undefined);
      const mockHandler2 = jest.fn().mockResolvedValue(undefined);
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler1);
      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler2);
      await service.publish(event);

      expect(mockHandler1).toHaveBeenCalledWith(event);
      expect(mockHandler2).toHaveBeenCalledWith(event);
    });

    it("should not call handlers for different event types", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      service.subscribe(EventType.HEALING_RECEIVED, mockHandler);
      await service.publish(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should filter events based on event filter", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const event1: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };
      const event2: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-2",
        payload: { damage: 15, damageType: "fire" } as any,
      };

      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler, {
        targetId: "character-1",
      });

      await service.publish(event1);
      await service.publish(event2);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(event1);
    });
  });

  describe("unsubscribe", () => {
    it("should remove handler and not call it after unsubscribe", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler);
      await service.publish(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);

      service.unsubscribe(EventType.DAMAGE_APPLIED, mockHandler);
      await service.publish(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("getEventObservable", () => {
    it("should return observable that emits events", (done) => {
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      const observable = service.getEventObservable(EventType.DAMAGE_APPLIED);

      observable.subscribe((receivedEvent) => {
        expect(receivedEvent).toEqual(event);
        done();
      });

      service.publish(event);
    });

    it("should filter events in observable", (done) => {
      const event1: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };
      const event2: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-2",
        payload: { damage: 15, damageType: "fire" } as any,
      };

      const observable = service.getEventObservable(EventType.DAMAGE_APPLIED, {
        targetId: "character-1",
      });

      const events: GameEvent[] = [];
      observable.subscribe((receivedEvent) => {
        events.push(receivedEvent);
        if (events.length === 1) {
          expect(events).toEqual([event1]);
          done();
        }
      });

      service.publish(event1);
      service.publish(event2);
    });
  });

  describe("getHandlerCount", () => {
    it("should return correct handler count", () => {
      expect(service.getHandlerCount(EventType.DAMAGE_APPLIED)).toBe(0);

      service.subscribe(EventType.DAMAGE_APPLIED, () => {});
      expect(service.getHandlerCount(EventType.DAMAGE_APPLIED)).toBe(1);

      service.subscribe(EventType.DAMAGE_APPLIED, () => {});
      expect(service.getHandlerCount(EventType.DAMAGE_APPLIED)).toBe(2);

      expect(service.getHandlerCount(EventType.HEALING_RECEIVED)).toBe(0);
    });
  });

  describe("getRegisteredEventTypes", () => {
    it("should return registered event types", () => {
      expect(service.getRegisteredEventTypes()).toEqual([]);

      service.subscribe(EventType.DAMAGE_APPLIED, () => {});
      service.subscribe(EventType.HEALING_RECEIVED, () => {});

      const types = service.getRegisteredEventTypes();
      expect(types).toContain(EventType.DAMAGE_APPLIED);
      expect(types).toContain(EventType.HEALING_RECEIVED);
      expect(types).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("should continue publishing even if handler throws", async () => {
      const mockHandler1 = jest
        .fn()
        .mockRejectedValue(new Error("Handler error"));
      const mockHandler2 = jest.fn().mockResolvedValue(undefined);
      const event: GameEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "character-1",
        payload: { damage: 10, damageType: "slashing" } as any,
      };

      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler1);
      service.subscribe(EventType.DAMAGE_APPLIED, mockHandler2);

      await expect(service.publish(event)).resolves.toBeUndefined();

      expect(mockHandler1).toHaveBeenCalledWith(event);
      expect(mockHandler2).toHaveBeenCalledWith(event);
    });
  });
});
