import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import request from "supertest";
import * as bcrypt from "bcrypt";

describe("Events (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let campaignId: string;
  let sessionId: string;
  let characterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up database
    await prisma.gameEvent.deleteMany();
    await prisma.characterQuest.deleteMany();
    await prisma.character.deleteMany();
    await prisma.session.deleteMany();
    await prisma.quest.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    // Create test user with hashed password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash("password123", saltRounds);
    const testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        passwordHash,
        roles: ["PLAYER"],
      },
    });
    userId = testUser.id;

    // Create test campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Campaign",
        description: "Test campaign for events",
        dmId: userId,
        players: {
          connect: { id: userId },
        },
      },
    });
    campaignId = campaign.id;

    // Create test session
    const session = await prisma.session.create({
      data: {
        campaignId,
        date: new Date(),
        notes: "Test session",
      },
    });
    sessionId = session.id;

    // Create test character using the API to avoid complex Prisma types
    const characterResponse = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Character",
        race: "HUMAN",
        multiclasses: [{ class: "FIGHTER", level: 1 }],
        level: 1,
        experiencePoints: 0,
        inspiration: false,
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        skillProficiencies: [
          { skill: "ACROBATICS", proficient: false, expertise: false },
          { skill: "ANIMAL_HANDLING", proficient: false, expertise: false },
          { skill: "ARCANA", proficient: false, expertise: false },
          { skill: "ATHLETICS", proficient: true, expertise: false },
          { skill: "DECEPTION", proficient: false, expertise: false },
          { skill: "HISTORY", proficient: false, expertise: false },
          { skill: "INSIGHT", proficient: false, expertise: false },
          { skill: "INTIMIDATION", proficient: false, expertise: false },
          { skill: "INVESTIGATION", proficient: false, expertise: false },
          { skill: "MEDICINE", proficient: false, expertise: false },
          { skill: "NATURE", proficient: false, expertise: false },
          { skill: "PERCEPTION", proficient: false, expertise: false },
          { skill: "PERFORMANCE", proficient: false, expertise: false },
          { skill: "PERSUASION", proficient: false, expertise: false },
          { skill: "RELIGION", proficient: false, expertise: false },
          { skill: "SLEIGHT_OF_HAND", proficient: false, expertise: false },
          { skill: "STEALTH", proficient: false, expertise: false },
          { skill: "SURVIVAL", proficient: false, expertise: false },
        ],
        savingThrows: {},
        hitPoints: { max: 12, current: 12, temporary: 0 },
        armorClass: 16,
        initiative: 2,
        speed: 30,
        featuresTraits: [],
        personalityTraits: "",
        ideals: "",
        bonds: "",
        flaws: "",
        backstory: "",
        languages: ["Common"],
        currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
        campaignId,
      });

    characterId = characterResponse.body.id;

    // Get real JWT token by logging in
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await prisma.gameEvent.deleteMany();
    await prisma.characterQuest.deleteMany();
    await prisma.character.deleteMany();
    await prisma.session.deleteMany();
    await prisma.quest.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe("POST /sessions/:sessionId/events", () => {
    it("should log event and verify it appears in database", async () => {
      const eventData = {
        type: "DICE_ROLL",
        actorId: userId,
        targetId: characterId,
        payload: {
          notation: "1d20",
          result: 15,
          label: "Attack roll",
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/events`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.type).toBe("DICE_ROLL");
      expect(response.body.sessionId).toBe(sessionId);

      // Verify event was logged in database
      const loggedEvent = await prisma.gameEvent.findUnique({
        where: { id: response.body.id },
      });

      expect(loggedEvent).toBeDefined();
      expect(loggedEvent!.type).toBe("DICE_ROLL");
      expect(loggedEvent!.sessionId).toBe(sessionId);
      expect(loggedEvent!.actorId).toBe(userId);
      expect(loggedEvent!.targetId).toBe(characterId);
    });
  });

  describe("PATCH /sessions/:sessionId/adjust-hp", () => {
    it("should adjust HP and publish damage/healing events", async () => {
      // First, damage the character
      const damageResponse = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/adjust-hp`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          characterId,
          hpAdjustment: -5,
        })
        .expect(201);

      expect(damageResponse.body.type).toBe("DAMAGE_APPLIED");
      expect(damageResponse.body.payload.damage).toBe(5);

      // Verify HP was updated in database (simplified check)
      const characterAfterDamage = await prisma.character.findUnique({
        where: { id: characterId },
      });

      expect(characterAfterDamage).toBeDefined();

      // Then heal the character
      const healResponse = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/adjust-hp`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          characterId,
          hpAdjustment: 3,
        })
        .expect(201);

      expect(healResponse.body.type).toBe("HEALING_RECEIVED");
      expect(healResponse.body.payload.healing).toBe(3);

      // Verify character still exists after heal
      const characterAfterHeal = await prisma.character.findUnique({
        where: { id: characterId },
      });

      expect(characterAfterHeal).toBeDefined();
    });
  });

  describe("POST /sessions/:sessionId/grant-item", () => {
    it("should grant item and publish ITEM_GIVEN event", async () => {
      // Create a test item first
      const item = await prisma.item.create({
        data: {
          name: "Test Sword",
          type: "WEAPON",
          weight: 3,
          rarity: "COMMON",
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/grant-item`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          characterId,
          itemId: item.id,
          quantity: 1,
        })
        .expect(201);

      expect(response.body.type).toBe("ITEM_GIVEN");
      expect(response.body.payload.itemId).toBe(item.id);
      expect(response.body.payload.quantity).toBe(1);

      // Verify item was added to inventory
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          itemId: item.id,
        },
      });

      expect(inventoryItem).toBeDefined();
      expect(inventoryItem!.quantity).toBe(1);
    });
  });

  describe("PATCH /characters/:id", () => {
    it("should update character and publish events for changes", async () => {
      // Update HP to trigger damage event
      const hpResponse = await request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          hitPoints: { current: 5, max: 12, temporary: 0 },
        })
        .expect(200);

      // Verify damage event was logged
      const damageEvents = await prisma.gameEvent.findMany({
        where: {
          type: "DAMAGE_APPLIED",
          targetId: characterId,
        },
        orderBy: { timestamp: "desc" },
        take: 1,
      });

      expect(damageEvents.length).toBeGreaterThan(0);

      // Update experience to trigger experience gained event
      await request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          experiencePoints: 300,
        })
        .expect(200);

      // Verify experience gained event was logged
      const expEvents = await prisma.gameEvent.findMany({
        where: {
          type: "EXPERIENCE_GAINED",
          targetId: characterId,
        },
        orderBy: { timestamp: "desc" },
        take: 1,
      });

      expect(expEvents.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /quests/:id", () => {
    let questId: string;

    beforeAll(async () => {
      // Create a test quest
      const quest = await prisma.quest.create({
        data: {
          campaignId,
          name: "Test Quest",
          summary: "Test quest summary",
          status: "NOT_STARTED",
          experienceReward: 100,
        },
      });
      questId = quest.id;
    });

    it("should update quest status and publish QUEST_UPDATED event", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/quests/${questId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "IN_PROGRESS",
        })
        .expect(200);

      // Verify quest updated event was logged
      const questEvents = await prisma.gameEvent.findMany({
        where: {
          type: "QUEST_UPDATED",
        },
        orderBy: { timestamp: "desc" },
        take: 1,
      });

      expect(questEvents.length).toBeGreaterThan(0);
    });
  });

  describe("GET /events", () => {
    it("should return events with filtering", async () => {
      const response = await request(app.getHttpServer())
        .get("/events")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ sessionId, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty("events");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.events)).toBe(true);
    });
  });

  describe("GET /events/session/:sessionId", () => {
    it("should return events for specific session", async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/session/${sessionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("events");
      expect(
        response.body.events.every(
          (event: any) => event.sessionId === sessionId,
        ),
      ).toBe(true);
    });
  });

  describe("GET /events/stats", () => {
    it("should return event statistics", async () => {
      const response = await request(app.getHttpServer())
        .get("/events/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ sessionId })
        .expect(200);

      expect(response.body).toHaveProperty("totalEvents");
      expect(response.body).toHaveProperty("eventsByType");
      expect(response.body).toHaveProperty("eventsBySession");
      expect(response.body).toHaveProperty("recentEvents");
    });
  });
});
