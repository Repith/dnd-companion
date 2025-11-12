import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { ItemType, Rarity } from "../src/modules/item/dto";

describe("Item (e2e)", () => {
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
      email: "itemtest@example.com",
      username: "itemtest",
      password: "password123",
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "itemtest@example.com",
        password: "password123",
      });

    accessToken = loginResponse.body.access_token;
  });

  beforeEach(async () => {
    // Clean up items before each test
    await prisma.item.deleteMany();
  });

  describe("/items (GET)", () => {
    beforeEach(async () => {
      // Create test items
      await prisma.item.createMany({
        data: [
          {
            id: "sword1",
            name: "Longsword",
            type: ItemType.WEAPON,
            rarity: Rarity.COMMON,
            weight: 3,
            properties: {
              damageDice: "1d8",
              requiredProficiency: "Martial Weapons",
            },
            description: "A standard longsword",
          },
          {
            id: "armor1",
            name: "Chain Mail",
            type: ItemType.ARMOR,
            rarity: Rarity.UNCOMMON,
            weight: 55,
            properties: {
              armorClassBonus: 6,
              requiredProficiency: "Heavy Armor",
            },
            description: "Heavy armor made of interlocking metal rings",
          },
          {
            id: "potion1",
            name: "Healing Potion",
            type: ItemType.CONSUMABLE,
            rarity: Rarity.COMMON,
            weight: 0.5,
            properties: { charges: 1, maxCharges: 1 },
            description: "A potion that restores hit points",
          },
        ],
      });
    });

    it("should return all items", () => {
      return request(app.getHttpServer())
        .get("/items")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(3);
          expect(res.body[0]).toHaveProperty("id");
          expect(res.body[0]).toHaveProperty("name");
          expect(res.body[0]).toHaveProperty("type");
          expect(res.body[0]).toHaveProperty("rarity");
        });
    });

    it("should filter items by type", () => {
      return request(app.getHttpServer())
        .get("/items?type=WEAPON")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].type).toBe("WEAPON");
          expect(res.body[0].name).toBe("Longsword");
        });
    });

    it("should filter items by rarity", () => {
      return request(app.getHttpServer())
        .get("/items?rarity=UNCOMMON")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].rarity).toBe("UNCOMMON");
          expect(res.body[0].name).toBe("Chain Mail");
        });
    });

    it("should search items by name", () => {
      return request(app.getHttpServer())
        .get("/items?search=sword")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].name).toBe("Longsword");
        });
    });

    it("should search items by description", () => {
      return request(app.getHttpServer())
        .get("/items?search=restores")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].name).toBe("Healing Potion");
        });
    });
  });

  describe("/items/:id (GET)", () => {
    beforeEach(async () => {
      await prisma.item.create({
        data: {
          id: "test-item",
          name: "Test Item",
          type: ItemType.WEAPON,
          rarity: Rarity.COMMON,
          weight: 2,
          description: "A test item",
        },
      });
    });

    it("should return a single item", () => {
      return request(app.getHttpServer())
        .get("/items/test-item")
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe("test-item");
          expect(res.body.name).toBe("Test Item");
          expect(res.body.type).toBe("WEAPON");
          expect(res.body.rarity).toBe("COMMON");
          expect(res.body.weight).toBe(2);
        });
    });

    it("should return 404 for non-existent item", () => {
      return request(app.getHttpServer()).get("/items/nonexistent").expect(404);
    });
  });

  describe("/items (POST)", () => {
    it("should create a new item", () => {
      return request(app.getHttpServer())
        .post("/items")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "New Sword",
          type: ItemType.WEAPON,
          rarity: Rarity.RARE,
          weight: 4,
          properties: {
            damageDice: "1d10",
            requiredProficiency: "Martial Weapons",
          },
          description: "A finely crafted sword",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.name).toBe("New Sword");
          expect(res.body.type).toBe("WEAPON");
          expect(res.body.rarity).toBe("RARE");
          expect(res.body.weight).toBe(4);
        });
    });

    it("should return 400 for invalid item data", () => {
      return request(app.getHttpServer())
        .post("/items")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "", // Invalid: empty name
          type: "INVALID_TYPE",
          weight: -1, // Invalid: negative weight
        })
        .expect(400);
    });

    it("should return 400 for weapon without damage dice", () => {
      return request(app.getHttpServer())
        .post("/items")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Invalid Weapon",
          type: ItemType.WEAPON,
          properties: {}, // Missing damageDice
        })
        .expect(400);
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .post("/items")
        .send({
          name: "Test Item",
          type: ItemType.WEAPON,
          properties: { damageDice: "1d8" },
        })
        .expect(401);
    });
  });

  describe("/items/:id (PATCH)", () => {
    beforeEach(async () => {
      await prisma.item.create({
        data: {
          id: "update-test",
          name: "Original Name",
          type: ItemType.WEAPON,
          rarity: Rarity.COMMON,
          weight: 3,
          properties: { damageDice: "1d8" },
        },
      });
    });

    it("should update an item", () => {
      return request(app.getHttpServer())
        .patch("/items/update-test")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated Name",
          weight: 3.5,
          description: "Updated description",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("Updated Name");
          expect(res.body.weight).toBe(3.5);
          expect(res.body.description).toBe("Updated description");
        });
    });

    it("should return 404 for non-existent item", () => {
      return request(app.getHttpServer())
        .patch("/items/nonexistent")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "New Name" })
        .expect(404);
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .patch("/items/update-test")
        .send({ name: "New Name" })
        .expect(401);
    });
  });

  describe("/items/:id (DELETE)", () => {
    beforeEach(async () => {
      await prisma.item.create({
        data: {
          id: "delete-test",
          name: "Item to Delete",
          type: ItemType.WEAPON,
          properties: { damageDice: "1d8" },
        },
      });
    });

    it("should delete an item", () => {
      return request(app.getHttpServer())
        .delete("/items/delete-test")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });

    it("should return 404 for non-existent item", () => {
      return request(app.getHttpServer())
        .delete("/items/nonexistent")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .delete("/items/delete-test")
        .expect(401);
    });
  });
});
