import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import request from "supertest";
import { CreateCharacterDto } from "../src/modules/character/dto";
import * as bcrypt from "bcrypt";

describe("Character (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up database
    await prisma.character.deleteMany();
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
    await prisma.character.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe("POST /characters", () => {
    const createCharacterDto: CreateCharacterDto = {
      name: "Test Fighter",
      race: "HUMAN" as any,
      multiclasses: [{ class: "FIGHTER" as any, level: 1 }],
      level: 1,
      experiencePoints: 0,
      inspiration: false,
      abilityScores: {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
      skillProficiencies: [
        { skill: "ACROBATICS" as any, proficient: false, expertise: false },
        {
          skill: "ANIMAL_HANDLING" as any,
          proficient: false,
          expertise: false,
        },
        { skill: "ARCANA" as any, proficient: false, expertise: false },
        { skill: "ATHLETICS" as any, proficient: true, expertise: false },
        { skill: "DECEPTION" as any, proficient: false, expertise: false },
        { skill: "HISTORY" as any, proficient: false, expertise: false },
        { skill: "INSIGHT" as any, proficient: false, expertise: false },
        { skill: "INTIMIDATION" as any, proficient: false, expertise: false },
        { skill: "INVESTIGATION" as any, proficient: false, expertise: false },
        { skill: "MEDICINE" as any, proficient: false, expertise: false },
        { skill: "NATURE" as any, proficient: false, expertise: false },
        { skill: "PERCEPTION" as any, proficient: false, expertise: false },
        { skill: "PERFORMANCE" as any, proficient: false, expertise: false },
        { skill: "PERSUASION" as any, proficient: false, expertise: false },
        { skill: "RELIGION" as any, proficient: false, expertise: false },
        {
          skill: "SLEIGHT_OF_HAND" as any,
          proficient: false,
          expertise: false,
        },
        { skill: "STEALTH" as any, proficient: false, expertise: false },
        { skill: "SURVIVAL" as any, proficient: false, expertise: false },
      ],
      savingThrows: { STRENGTH: true, CONSTITUTION: true },
      hitPoints: { max: 12, current: 12, temporary: 0 },
      armorClass: 16,
      initiative: 2,
      speed: 30,
      featuresTraits: ["Fighting Style (Archery)"],
      languages: ["Common"],
      currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
      ownerId: userId,
    };

    it("should create a character", () => {
      return request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send(createCharacterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.name).toBe("Test Fighter");
          expect(res.body.race).toBe("HUMAN");
          expect(res.body.class).toBe("FIGHTER");
          expect(res.body.level).toBe(1);
          expect(res.body.abilityScores).toBeDefined();
          expect(res.body.skillProficiencies).toHaveLength(18);
        });
    });

    it("should validate required fields", () => {
      return request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Invalid Character" })
        .expect(400);
    });

    it("should validate ability scores range", () => {
      const invalidDto = {
        ...createCharacterDto,
        abilityScores: {
          ...createCharacterDto.abilityScores,
          strength: 25, // Invalid: too high
        },
      };

      return request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it("should validate level range", () => {
      const invalidDto = {
        ...createCharacterDto,
        level: 25, // Invalid: too high
      };

      return request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("GET /characters", () => {
    it("should return user's characters", async () => {
      // First create a character
      const createResponse = await request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Character 2",
          race: "ELF" as any,
          class: "WIZARD" as any,
          level: 3,
          experiencePoints: 900,
          inspiration: true,
          abilityScores: {
            strength: 8,
            dexterity: 14,
            constitution: 12,
            intelligence: 16,
            wisdom: 10,
            charisma: 13,
          },
          skillProficiencies: [
            { skill: "ACROBATICS" as any, proficient: false, expertise: false },
            {
              skill: "ANIMAL_HANDLING" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "ARCANA" as any, proficient: true, expertise: false },
            { skill: "ATHLETICS" as any, proficient: false, expertise: false },
            { skill: "DECEPTION" as any, proficient: false, expertise: false },
            { skill: "HISTORY" as any, proficient: false, expertise: false },
            { skill: "INSIGHT" as any, proficient: false, expertise: false },
            {
              skill: "INTIMIDATION" as any,
              proficient: false,
              expertise: false,
            },
            {
              skill: "INVESTIGATION" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "MEDICINE" as any, proficient: false, expertise: false },
            { skill: "NATURE" as any, proficient: false, expertise: false },
            { skill: "PERCEPTION" as any, proficient: false, expertise: false },
            {
              skill: "PERFORMANCE" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "PERSUASION" as any, proficient: false, expertise: false },
            { skill: "RELIGION" as any, proficient: false, expertise: false },
            {
              skill: "SLEIGHT_OF_HAND" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "STEALTH" as any, proficient: false, expertise: false },
            { skill: "SURVIVAL" as any, proficient: false, expertise: false },
          ],
          savingThrows: { INTELLIGENCE: true, WISDOM: true },
          hitPoints: { max: 18, current: 15, temporary: 0 },
          armorClass: 13,
          initiative: 2,
          speed: 30,
          featuresTraits: ["Spellcasting"],
          languages: ["Common", "Elvish"],
          currency: { cp: 50, sp: 0, ep: 0, gp: 25, pp: 0 },
          ownerId: userId,
        };
        });

      const characterId = createResponse.body.id;

      return request(app.getHttpServer())
        .get("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty("id");
          expect(res.body[0]).toHaveProperty("name");
          expect(res.body[0]).toHaveProperty("abilityScores");
        });
    });
  });

  describe("GET /characters/:id", () => {
    let characterId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Character for GET",
          race: "DWARF" as any,
          class: "CLERIC" as any,
          level: 2,
          experiencePoints: 300,
          inspiration: false,
          abilityScores: {
            strength: 14,
            dexterity: 10,
            constitution: 16,
            intelligence: 8,
            wisdom: 15,
            charisma: 12,
          },
          skillProficiencies: [
            { skill: "ACROBATICS" as any, proficient: false, expertise: false },
            {
              skill: "ANIMAL_HANDLING" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "ARCANA" as any, proficient: false, expertise: false },
            { skill: "ATHLETICS" as any, proficient: false, expertise: false },
            { skill: "DECEPTION" as any, proficient: false, expertise: false },
            { skill: "HISTORY" as any, proficient: false, expertise: false },
            { skill: "INSIGHT" as any, proficient: false, expertise: false },
            {
              skill: "INTIMIDATION" as any,
              proficient: false,
              expertise: false,
            },
            {
              skill: "INVESTIGATION" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "MEDICINE" as any, proficient: true, expertise: false },
            { skill: "NATURE" as any, proficient: false, expertise: false },
            { skill: "PERCEPTION" as any, proficient: false, expertise: false },
            {
              skill: "PERFORMANCE" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "PERSUASION" as any, proficient: false, expertise: false },
            { skill: "RELIGION" as any, proficient: true, expertise: false },
            {
              skill: "SLEIGHT_OF_HAND" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "STEALTH" as any, proficient: false, expertise: false },
            { skill: "SURVIVAL" as any, proficient: false, expertise: false },
          ],
          savingThrows: { WISDOM: true, CHARISMA: true },
          hitPoints: { max: 16, current: 16, temporary: 0 },
          armorClass: 18,
          initiative: 0,
          speed: 25,
          featuresTraits: ["Divine Domain (Life)"],
          languages: ["Common", "Dwarvish"],
          currency: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 },
          ownerId: userId,
        });

      characterId = createResponse.body.id;
    });

    it("should return a specific character", () => {
      return request(app.getHttpServer())
        .get(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(characterId);
          expect(res.body.name).toBe("Test Character for GET");
          expect(res.body.race).toBe("DWARF");
          expect(res.body.class).toBe("CLERIC");
          expect(res.body.level).toBe(2);
          expect(res.body.abilityScores).toBeDefined();
          expect(res.body.skillProficiencies).toHaveLength(18);
        });
    });

    it("should return 404 for non-existent character", () => {
      return request(app.getHttpServer())
        .get("/characters/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("PATCH /characters/:id", () => {
    let characterId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Character for PATCH",
          race: "HALFLING" as any,
          class: "ROGUE" as any,
          level: 1,
          experiencePoints: 0,
          inspiration: false,
          abilityScores: {
            strength: 8,
            dexterity: 16,
            constitution: 14,
            intelligence: 12,
            wisdom: 10,
            charisma: 10,
          },
          skillProficiencies: [
            { skill: "ACROBATICS" as any, proficient: true, expertise: false },
            {
              skill: "ANIMAL_HANDLING" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "ARCANA" as any, proficient: false, expertise: false },
            { skill: "ATHLETICS" as any, proficient: false, expertise: false },
            { skill: "DECEPTION" as any, proficient: true, expertise: false },
            { skill: "HISTORY" as any, proficient: false, expertise: false },
            { skill: "INSIGHT" as any, proficient: false, expertise: false },
            {
              skill: "INTIMIDATION" as any,
              proficient: false,
              expertise: false,
            },
            {
              skill: "INVESTIGATION" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "MEDICINE" as any, proficient: false, expertise: false },
            { skill: "NATURE" as any, proficient: false, expertise: false },
            { skill: "PERCEPTION" as any, proficient: false, expertise: false },
            {
              skill: "PERFORMANCE" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "PERSUASION" as any, proficient: false, expertise: false },
            { skill: "RELIGION" as any, proficient: false, expertise: false },
            {
              skill: "SLEIGHT_OF_HAND" as any,
              proficient: true,
              expertise: false,
            },
            { skill: "STEALTH" as any, proficient: true, expertise: false },
            { skill: "SURVIVAL" as any, proficient: false, expertise: false },
          ],
          savingThrows: { DEXTERITY: true, INTELLIGENCE: true },
          hitPoints: { max: 8, current: 8, temporary: 0 },
          armorClass: 14,
          initiative: 3,
          speed: 25,
          featuresTraits: ["Sneak Attack"],
          languages: ["Common", "Halfling"],
          currency: { cp: 0, sp: 10, ep: 0, gp: 5, pp: 0 },
          ownerId: userId,
        });

      characterId = createResponse.body.id;
    });

    it("should update a character", () => {
      return request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Rogue",
          level: 2,
          experiencePoints: 300,
          inspiration: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("Updated Rogue");
          expect(res.body.level).toBe(2);
          expect(res.body.experiencePoints).toBe(300);
          expect(res.body.inspiration).toBe(true);
        });
    });

    it("should validate update data", () => {
      return request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          level: 25, // Invalid level
        })
        .expect(400);
    });
  });

  describe("DELETE /characters/:id", () => {
    let characterId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post("/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Character for DELETE",
          race: "DRAGONBORN" as any,
          class: "BARBARIAN" as any,
          level: 1,
          experiencePoints: 0,
          inspiration: false,
          abilityScores: {
            strength: 17,
            dexterity: 12,
            constitution: 15,
            intelligence: 8,
            wisdom: 10,
            charisma: 13,
          },
          skillProficiencies: [
            { skill: "ACROBATICS" as any, proficient: false, expertise: false },
            {
              skill: "ANIMAL_HANDLING" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "ARCANA" as any, proficient: false, expertise: false },
            { skill: "ATHLETICS" as any, proficient: false, expertise: false },
            { skill: "DECEPTION" as any, proficient: false, expertise: false },
            { skill: "HISTORY" as any, proficient: false, expertise: false },
            { skill: "INSIGHT" as any, proficient: false, expertise: false },
            {
              skill: "INTIMIDATION" as any,
              proficient: true,
              expertise: false,
            },
            {
              skill: "INVESTIGATION" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "MEDICINE" as any, proficient: false, expertise: false },
            { skill: "NATURE" as any, proficient: false, expertise: false },
            { skill: "PERCEPTION" as any, proficient: false, expertise: false },
            {
              skill: "PERFORMANCE" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "PERSUASION" as any, proficient: false, expertise: false },
            { skill: "RELIGION" as any, proficient: false, expertise: false },
            {
              skill: "SLEIGHT_OF_HAND" as any,
              proficient: false,
              expertise: false,
            },
            { skill: "STEALTH" as any, proficient: false, expertise: false },
            { skill: "SURVIVAL" as any, proficient: false, expertise: false },
          ],
          savingThrows: { STRENGTH: true, CONSTITUTION: true },
          hitPoints: { max: 14, current: 14, temporary: 0 },
          armorClass: 15,
          initiative: 1,
          speed: 30,
          featuresTraits: ["Rage"],
          languages: ["Common", "Draconic"],
          currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
          ownerId: userId,
        });

      characterId = createResponse.body.id;
    });

    it("should delete a character", () => {
      return request(app.getHttpServer())
        .delete(`/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
    });

    it("should return 404 when trying to delete non-existent character", () => {
      return request(app.getHttpServer())
        .delete("/characters/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
