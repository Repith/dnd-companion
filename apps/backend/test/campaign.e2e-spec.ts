import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";

describe("Campaign (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let dmId: string;
  let campaignId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Clean up database
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    // Create test user (DM)
    const dm = await prisma.user.create({
      data: {
        email: "dm@test.com",
        username: "dm",
        passwordHash: "hashedpassword",
        roles: ["DM"],
      },
    });
    dmId = dm.id;

    // Login to get token (simplified - in real test you'd use auth service)
    authToken = "mock-jwt-token";
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe("POST /campaigns", () => {
    it("should create a campaign", () => {
      return request(app.getHttpServer())
        .post("/campaigns")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Campaign",
          description: "A test campaign for e2e testing",
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty("id");
          expect(response.body.name).toBe("Test Campaign");
          expect(response.body.dmId).toBe(dmId);
          campaignId = response.body.id;
        });
    });
  });

  describe("GET /campaigns", () => {
    it("should return user's campaigns", () => {
      return request(app.getHttpServer())
        .get("/campaigns")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].dmId).toBe(dmId);
        });
    });
  });

  describe("GET /campaigns/:id", () => {
    it("should return a specific campaign", () => {
      return request(app.getHttpServer())
        .get(`/campaigns/${campaignId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(campaignId);
          expect(response.body.name).toBe("Test Campaign");
        });
    });

    it("should return 403 for non-participant", () => {
      return request(app.getHttpServer())
        .get("/campaigns/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe("PUT /campaigns/:id", () => {
    it("should update a campaign", () => {
      return request(app.getHttpServer())
        .put(`/campaigns/${campaignId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Campaign Name",
          description: "Updated description",
        })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe("Updated Campaign Name");
          expect(response.body.description).toBe("Updated description");
        });
    });
  });
});
