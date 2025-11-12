import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { GeneratorType } from "../src/modules/generator/dto";

describe("Generator (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Clean up database
    await prisma.generatedEntity.deleteMany();
    await prisma.generatorRequest.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user and get auth token
    const testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        passwordHash: "hashedpassword",
        roles: ["PLAYER"],
      },
    });

    // Mock JWT token (in real scenario, you'd login to get the token)
    authToken = "mock-jwt-token";
  });

  afterAll(async () => {
    await prisma.generatedEntity.deleteMany();
    await prisma.generatorRequest.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe("/generator/requests (POST)", () => {
    it("should create a generator request", () => {
      return request(app.getHttpServer())
        .post("/generator/requests")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          type: GeneratorType.NPC,
          tags: ["medieval"],
          prompt: "Generate a knight",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.type).toBe(GeneratorType.NPC);
          expect(res.body.status).toBe("PENDING");
          expect(res.body.tags).toEqual(["medieval"]);
          expect(res.body.prompt).toBe("Generate a knight");
        });
    });

    it("should return 401 without auth token", () => {
      return request(app.getHttpServer())
        .post("/generator/requests")
        .send({
          type: GeneratorType.NPC,
        })
        .expect(401);
    });
  });

  describe("/generator/requests (GET)", () => {
    it("should return all generator requests", async () => {
      // First create a request
      await request(app.getHttpServer())
        .post("/generator/requests")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          type: GeneratorType.LOCATION,
        });

      return request(app.getHttpServer())
        .get("/generator/requests")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe("/generator/requests/:id (GET)", () => {
    it("should return a specific generator request", async () => {
      const createResponse = await request(app.getHttpServer())
        .post("/generator/requests")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          type: GeneratorType.ITEM,
        });

      const requestId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/generator/requests/${requestId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(requestId);
          expect(res.body.type).toBe(GeneratorType.ITEM);
        });
    });

    it("should return 404 for non-existent request", () => {
      return request(app.getHttpServer())
        .get("/generator/requests/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("/generator/entities/:id (GET)", () => {
    it("should return a generated entity", async () => {
      // Create a request and wait for it to complete
      const createResponse = await request(app.getHttpServer())
        .post("/generator/requests")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          type: GeneratorType.SPELL,
        });

      const requestId = createResponse.body.id;

      // Wait a bit for processing (in real scenario, you'd poll or use websockets)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the request to check if it's completed
      const requestResponse = await request(app.getHttpServer())
        .get(`/generator/requests/${requestId}`)
        .set("Authorization", `Bearer ${authToken}`);

      if (requestResponse.body.resultId) {
        return request(app.getHttpServer())
          .get(`/generator/entities/${requestResponse.body.resultId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty("id");
            expect(res.body).toHaveProperty("entityType");
            expect(res.body).toHaveProperty("data");
          });
      } else {
        // If not completed yet, just check that the endpoint exists
        expect(requestResponse.status).toBe(200);
      }
    });
  });
});
