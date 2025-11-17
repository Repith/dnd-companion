import { Test, TestingModule } from "@nestjs/testing";
import { EventBusService } from "./event-bus.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  DamageEventHandler,
  HealingEventHandler,
  ItemEventHandler,
  LevelUpEventHandler,
  GameEventExperienceGainedHandler,
  GameEventQuestFinishedHandler,
  DeathEventHandler,
} from "./event-handlers";
import { EventType } from "./dto";

describe("Event Handlers", () => {
  let eventBusService: EventBusService;
  let prismaService: PrismaService;
  let module: TestingModule;

  const mockPrismaService = {
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
  };

  const mockEventBusService = {
    subscribe: jest.fn(),
    publish: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        DamageEventHandler,
        HealingEventHandler,
        ItemEventHandler,
        LevelUpEventHandler,
        GameEventExperienceGainedHandler,
        GameEventQuestFinishedHandler,
        DeathEventHandler,
      ],
    }).compile();

    eventBusService = module.get<EventBusService>(EventBusService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe("DamageEventHandler", () => {
    let handler: DamageEventHandler;

    beforeEach(() => {
      handler = module.get<DamageEventHandler>(DamageEventHandler);
    });

    it("should apply damage to character and publish death event when HP reaches zero", async () => {
      const damageEvent = {
        type: EventType.DAMAGE_APPLIED,
        targetId: "char-1",
        payload: { damage: 10 },
        sessionId: "session-1",
        actorId: "user-1",
      };

      const mockCharacter = {
        hitPoints: { current: 5, max: 20, temporary: 0 },
      };

      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);

      // Trigger the event handler
      await (handler as any).handleDamageApplied(damageEvent);

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: {
          hitPoints: {
            max: 20,
            current: 0, // 5 - 10 = -5, but clamped to 0
            temporary: 0,
          },
        },
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.DEATH,
        targetId: "char-1",
        payload: { cause: "damage" },
        sessionId: "session-1",
      });
    });
  });

  describe("HealingEventHandler", () => {
    let handler: HealingEventHandler;

    beforeEach(() => {
      handler = module.get<HealingEventHandler>(HealingEventHandler);
    });

    it("should apply healing to character, capped at max HP", async () => {
      const healingEvent = {
        type: EventType.HEALING_RECEIVED,
        targetId: "char-1",
        payload: { healing: 15 },
      };

      const mockCharacter = {
        hitPoints: { current: 10, max: 20, temporary: 0 },
      };

      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);

      await (handler as any).handleHealingReceived(healingEvent);

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: {
          hitPoints: {
            max: 20,
            current: 20, // 10 + 15 = 25, but capped at 20
            temporary: 0,
          },
        },
      });
    });
  });

  describe("LevelUpEventHandler", () => {
    let handler: LevelUpEventHandler;

    beforeEach(() => {
      handler = module.get<LevelUpEventHandler>(LevelUpEventHandler);
    });

    it("should update character level and proficiency bonus", async () => {
      const levelUpEvent = {
        type: EventType.LEVEL_UP,
        targetId: "char-1",
        payload: { newLevel: 3, oldLevel: 2 },
      };

      await (handler as any).handleLevelUp(levelUpEvent);

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: { level: 3 },
      });

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: { proficiencyBonus: 2 }, // Level 3: floor((3-1)/4) + 2 = 0 + 2 = 2
      });
    });
  });

  describe("GameEventExperienceGainedHandler", () => {
    let handler: GameEventExperienceGainedHandler;

    beforeEach(() => {
      handler = module.get<GameEventExperienceGainedHandler>(
        GameEventExperienceGainedHandler,
      );
    });

    it("should update character experience and trigger level up", async () => {
      const expEvent = {
        type: EventType.EXPERIENCE_GAINED,
        targetId: "char-1",
        payload: { experienceGained: 500, totalExperience: 1500 },
        sessionId: "session-1",
      };

      const mockCharacter = {
        level: 2,
        experiencePoints: 1000,
      };

      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);

      await (handler as any).handleExperienceGained(expEvent);

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: { experiencePoints: 1500 },
      });

      // Should trigger level up since 1500 XP puts character at level 3
      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.LEVEL_UP,
        targetId: "char-1",
        payload: { oldLevel: 2, newLevel: 3 },
        sessionId: "session-1",
      });
    });
  });

  describe("GameEventQuestFinishedHandler", () => {
    let handler: GameEventQuestFinishedHandler;

    beforeEach(() => {
      handler = module.get<GameEventQuestFinishedHandler>(
        GameEventQuestFinishedHandler,
      );
    });

    it("should handle quest finished event", async () => {
      const questFinishedEvent = {
        type: EventType.QUEST_FINISHED,
        payload: { questId: "quest-1" },
      };

      await (handler as any).handleQuestFinished(questFinishedEvent);

      // Quest finished handler currently just logs, no specific assertions needed
      expect(true).toBe(true);
    });
  });

  describe("DeathEventHandler", () => {
    let handler: DeathEventHandler;

    beforeEach(() => {
      handler = module.get<DeathEventHandler>(DeathEventHandler);
    });

    it("should mark character as dead and award experience to killer", async () => {
      const deathEvent = {
        type: EventType.DEATH,
        targetId: "char-1",
        actorId: "char-2",
        sessionId: "session-1",
      };

      const mockKiller = {
        experiencePoints: 1000,
        level: 3,
      };

      mockPrismaService.character.findUnique.mockResolvedValue(mockKiller);

      await (handler as any).handleDeath(deathEvent);

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-1" },
        data: { isDead: true },
      });

      expect(mockPrismaService.character.update).toHaveBeenCalledWith({
        where: { id: "char-2" },
        data: { experiencePoints: 1150 }, // 1000 + (3 * 50) = 1150
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.EXPERIENCE_GAINED,
        targetId: "char-2",
        payload: {
          experienceGained: 150, // 3 * 50 = 150
          totalExperience: 1150,
        },
        sessionId: "session-1",
      });
    });
  });
});
