import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { ItemType } from "../src/modules/item/dto";
import { OwnerType } from "../src/modules/inventory/dto";

describe("Inventory (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let characterId: string;
  let inventoryId: string;
  let itemId: string;

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
    // Register and login to get token
    const registerResponse = await request(app.getHttpServer())
      .post("/users/register")
      .send({
        email: "inventorytest@example.com",
        username: "inventorytest",
        password: "password123",
      });

    userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "inventorytest@example.com",
        password: "password123",
      });

    accessToken = loginResponse.body.access_token;

    // Create a test item
    const itemResponse = await request(app.getHttpServer())
      .post("/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Test Sword",
        type: ItemType.WEAPON,
        properties: { damageDice: "1d8" },
        weight: 3,
      });

    itemId = itemResponse.body.id;

    // Create a test character
    const characterResponse = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Test Character",
        race: "HUMAN",
        class: "FIGHTER",
        level: 1,
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        hitPoints: { max: 12, current: 12, temporary: 0 },
        skillProficiencies: [
          { skill: "ATHLETICS", proficient: true, expertise: false },
        ],
      });

    characterId = characterResponse.body.id;

    // Get inventory ID from character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { inventoryId: true },
    });
    inventoryId = character!.inventoryId!;
  });

  beforeEach(async () => {
    // Clean up inventory items before each test
    await prisma.inventoryItem.deleteMany();
  });

  describe("/inventories/:id (GET)", () => {
    it("should return inventory details", () => {
      return request(app.getHttpServer())
        .get(`/inventories/${inventoryId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(inventoryId);
          expect(res.body.ownerType).toBe("CHARACTER");
          expect(res.body.ownerId).toBe(characterId);
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body).toHaveProperty("encumbrance");
          expect(res.body.encumbrance).toHaveProperty("currentWeight");
          expect(res.body.encumbrance).toHaveProperty("maxWeight");
          expect(res.body.encumbrance).toHaveProperty("isEncumbered");
        });
    });

    it("should return 403 for unauthorized access", () => {
      return request(app.getHttpServer())
        .get(`/inventories/${inventoryId}`)
        .expect(401); // No token
    });
  });

  describe("/inventories/character/:characterId (GET)", () => {
    it("should return character inventory", () => {
      return request(app.getHttpServer())
        .get(`/inventories/character/${characterId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ownerType).toBe("CHARACTER");
          expect(res.body.ownerId).toBe(characterId);
        });
    });
  });

  describe("/inventories/:id/items (POST)", () => {
    it("should add item to inventory", () => {
      return request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: itemId,
          quantity: 2,
          notes: "Test notes",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].itemId).toBe(itemId);
          expect(res.body.items[0].quantity).toBe(2);
          expect(res.body.items[0].notes).toBe("Test notes");
          expect(res.body.items[0].equipped).toBe(false);
        });
    });

    it("should increment quantity for existing item", async () => {
      // First add item
      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: itemId,
          quantity: 1,
        });

      // Add same item again
      return request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: itemId,
          quantity: 2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].quantity).toBe(3);
        });
    });

    it("should return 404 for non-existent item", () => {
      return request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: "nonexistent",
          quantity: 1,
        })
        .expect(400);
    });
  });

  describe("/inventories/:id/items/:itemId (PATCH)", () => {
    beforeEach(async () => {
      // Add item to inventory
      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: itemId,
          quantity: 3,
        });
    });

    it("should update item quantity", () => {
      return request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}/items/${itemId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          quantity: 5,
          notes: "Updated notes",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].quantity).toBe(5);
          expect(res.body.items[0].notes).toBe("Updated notes");
        });
    });

    it("should equip item", () => {
      return request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}/items/${itemId}/equip`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          equipped: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].equipped).toBe(true);
        });
    });

    it("should unequip item", () => {
      return request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}/items/${itemId}/equip`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          equipped: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].equipped).toBe(false);
        });
    });

    it("should return 400 for equipping non-equippable item", async () => {
      // Create a consumable item
      const potionResponse = await request(app.getHttpServer())
        .post("/items")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test Potion",
          type: ItemType.CONSUMABLE,
          properties: { charges: 1, maxCharges: 1 },
          weight: 0.5,
        });

      const potionId = potionResponse.body.id;

      // Add potion to inventory
      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: potionId,
          quantity: 1,
        });

      // Try to equip potion
      return request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}/items/${potionId}/equip`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          equipped: true,
        })
        .expect(400);
    });
  });

  describe("/inventories/:id/items/:itemId (DELETE)", () => {
    beforeEach(async () => {
      // Add item to inventory
      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          itemId: itemId,
          quantity: 3,
        });
    });

    it("should remove partial quantity", () => {
      return request(app.getHttpServer())
        .delete(`/inventories/${inventoryId}/items/${itemId}?quantity=2`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].quantity).toBe(1);
        });
    });

    it("should remove item completely", () => {
      return request(app.getHttpServer())
        .delete(`/inventories/${inventoryId}/items/${itemId}?quantity=3`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
        });
    });

    it("should return 404 for item not in inventory", () => {
      return request(app.getHttpServer())
        .delete(`/inventories/${inventoryId}/items/nonexistent`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
