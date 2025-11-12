import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";

describe("DM Zone (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let campaignId: string;
  let locationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Clean up database
    await prisma.dMNote.deleteMany();
    await prisma.link.deleteMany();
    await prisma.location.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and campaign
    const user = await prisma.user.create({
      data: {
        email: "dm@example.com",
        username: "dm",
        passwordHash: "hashed",
        roles: ["DM"],
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Campaign",
        dmId: user.id,
      },
    });

    campaignId = campaign.id;

    // Mock JWT token (in real test, you'd get this from login)
    authToken = "mock-jwt-token";
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Locations", () => {
    it("should create a location (DM only)", () => {
      return request(app.getHttpServer())
        .post(`/campaigns/${campaignId}/locations`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test City",
          type: "CITY",
          description: "A test city",
        })
        .expect(201)
        .then((response) => {
          expect(response.body.name).toBe("Test City");
          expect(response.body.type).toBe("CITY");
          locationId = response.body.id;
        });
    });

    it("should get all locations", () => {
      return request(app.getHttpServer())
        .get(`/campaigns/${campaignId}/locations`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it("should get location hierarchy", () => {
      return request(app.getHttpServer())
        .get(`/campaigns/${campaignId}/locations/hierarchy`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it("should update a location (DM only)", () => {
      return request(app.getHttpServer())
        .put(`/campaigns/${campaignId}/locations/${locationId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Updated test city",
        })
        .expect(200)
        .then((response) => {
          expect(response.body.description).toBe("Updated test city");
        });
    });

    it("should delete a location (DM only)", () => {
      return request(app.getHttpServer())
        .delete(`/campaigns/${campaignId}/locations/${locationId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe("DM Notes", () => {
    let noteId: string;

    it("should create a DM note", () => {
      return request(app.getHttpServer())
        .post("/dm-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: "Test DM note",
        })
        .expect(201)
        .then((response) => {
          expect(response.body.content).toBe("Test DM note");
          noteId = response.body.id;
        });
    });

    it("should get all DM notes", () => {
      return request(app.getHttpServer())
        .get("/dm-notes")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it("should create a link", () => {
      return request(app.getHttpServer())
        .post(`/dm-notes/${noteId}/links`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          relatedEntityType: "LOCATION",
          relatedEntityId: locationId,
          relationship: "located in",
        })
        .expect(201);
    });

    it("should get links for a note", () => {
      return request(app.getHttpServer())
        .get(`/dm-notes/${noteId}/links`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });
});
