import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { SpellSchool } from "../src/modules/spell/dto";

describe("Spell (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    // Register and login to get token for authenticated requests
    await request(app.getHttpServer()).post("/users/register").send({
      email: "spelltest@example.com",
      username: "spelltest",
      password: "password123",
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "spelltest@example.com",
        password: "password123",
      });

    accessToken = loginResponse.body.access_token;
  });

  beforeEach(async () => {
    // Clean up spells before each test
    await prisma.spell.deleteMany();
  });

  describe("/spells (GET)", () => {
    beforeEach(async () => {
      // Create test spells
      await prisma.spell.createMany({
        data: [
          {
            id: "magic-missile",
            name: "Magic Missile",
            level: 1,
            school: SpellSchool.EVOCATION,
            castingTime: "1 action",
            range: "120 feet",
            components: { verbal: true, somatic: true },
            duration: { duration: "Instantaneous" },
            classes: ["Wizard", "Sorcerer"],
            description: "You create three glowing darts of magical force.",
          },
          {
            id: "fireball",
            name: "Fireball",
            level: 3,
            school: SpellSchool.EVOCATION,
            castingTime: "1 action",
            range: "150 feet",
            components: {
              verbal: true,
              somatic: true,
              material: "a tiny ball of bat guano and sulfur",
            },
            duration: { duration: "Instantaneous" },
            classes: ["Wizard", "Sorcerer"],
            description:
              "A bright streak flashes from your pointing finger to a point you choose.",
          },
        ],
      });
    });

    it("should return all spells", () => {
      return request(app.getHttpServer())
        .get("/spells")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty("id");
          expect(res.body[0]).toHaveProperty("name");
          expect(res.body[0]).toHaveProperty("level");
        });
    });

    it("should filter spells by level", () => {
      return request(app.getHttpServer())
        .get("/spells?level=1")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].level).toBe(1);
          expect(res.body[0].name).toBe("Magic Missile");
        });
    });

    it("should filter spells by class", () => {
      return request(app.getHttpServer())
        .get("/spells?class=Wizard")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });
  });

  describe("/spells/:id (GET)", () => {
    beforeEach(async () => {
      await prisma.spell.create({
        data: {
          id: "test-spell",
          name: "Test Spell",
          level: 1,
          duration: { duration: "Instantaneous" },
          classes: ["Wizard"],
          description: "A test spell",
        },
      });
    });

    it("should return a single spell", () => {
      return request(app.getHttpServer())
        .get("/spells/test-spell")
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe("test-spell");
          expect(res.body.name).toBe("Test Spell");
          expect(res.body.level).toBe(1);
        });
    });

    it("should return 404 for non-existent spell", () => {
      return request(app.getHttpServer())
        .get("/spells/nonexistent")
        .expect(404);
    });
  });

  describe("/spells (POST)", () => {
    it("should create a new spell", () => {
      return request(app.getHttpServer())
        .post("/spells")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "New Spell",
          level: 2,
          school: SpellSchool.CONJURATION,
          castingTime: "1 action",
          range: "60 feet",
          components: { verbal: true, somatic: true },
          duration: { duration: "1 minute", concentration: true },
          classes: ["Wizard"],
          description: "A new spell for testing",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.name).toBe("New Spell");
          expect(res.body.level).toBe(2);
          expect(res.body.school).toBe("CONJURATION");
        });
    });

    it("should return 400 for invalid spell data", () => {
      return request(app.getHttpServer())
        .post("/spells")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "", // Invalid: empty name
          level: 10, // Invalid: level too high
          classes: [], // Invalid: no classes
        })
        .expect(400);
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .post("/spells")
        .send({
          name: "Test Spell",
          level: 1,
          duration: { duration: "Instantaneous" },
          classes: ["Wizard"],
        })
        .expect(401);
    });
  });

  describe("/spells/:id (PATCH)", () => {
    beforeEach(async () => {
      await prisma.spell.create({
        data: {
          id: "update-test",
          name: "Original Spell",
          level: 1,
          duration: { duration: "Instantaneous" },
          classes: ["Wizard"],
        },
      });
    });

    it("should update a spell", () => {
      return request(app.getHttpServer())
        .patch("/spells/update-test")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated Spell",
          description: "Updated description",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("Updated Spell");
          expect(res.body.description).toBe("Updated description");
        });
    });
  });

  describe("/spells/:id (DELETE)", () => {
    beforeEach(async () => {
      await prisma.spell.create({
        data: {
          id: "delete-test",
          name: "Spell to Delete",
          level: 1,
          duration: { duration: "Instantaneous" },
          classes: ["Wizard"],
        },
      });
    });

    it("should delete a spell", () => {
      return request(app.getHttpServer())
        .delete("/spells/delete-test")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
