import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import * as bcrypt from "bcrypt";

describe("User (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
  });

  describe("/users/register (POST)", () => {
    it("should register a new user", () => {
      return request(app.getHttpServer())
        .post("/users/register")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("access_token");
          expect(res.body).toHaveProperty("user");
          expect(res.body.user.email).toBe("test@example.com");
          expect(res.body.user.username).toBe("testuser");
          expect(res.body.user.roles).toEqual(["PLAYER"]);
          expect(res.body.user).not.toHaveProperty("passwordHash");
        });
    });

    it("should return 400 for invalid data", () => {
      return request(app.getHttpServer())
        .post("/users/register")
        .send({
          email: "invalid-email",
          username: "tu",
          password: "123",
        })
        .expect(400);
    });

    it("should return 409 for duplicate email", async () => {
      // First register a user
      await request(app.getHttpServer())
        .post("/users/register")
        .send({
          email: "duplicate@example.com",
          username: "user1",
          password: "password123",
        })
        .expect(201);

      // Try to register with same email
      return request(app.getHttpServer())
        .post("/users/register")
        .send({
          email: "duplicate@example.com",
          username: "user2",
          password: "password123",
        })
        .expect(409);
    });
  });

  describe("/auth/login (POST)", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer()).post("/users/register").send({
        email: "login@example.com",
        username: "logintest",
        password: "password123",
      });
    });

    it("should login successfully", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("access_token");
          expect(res.body).toHaveProperty("user");
          expect(res.body.user.email).toBe("login@example.com");
        });
    });

    it("should return 401 for invalid credentials", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        })
        .expect(401);
    });
  });

  describe("/users/profile (GET)", () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      await request(app.getHttpServer()).post("/users/register").send({
        email: "profile@example.com",
        username: "profiletest",
        password: "password123",
      });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "profile@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.access_token;
    });

    it("should get user profile with valid token", () => {
      return request(app.getHttpServer())
        .get("/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe("profile@example.com");
          expect(res.body.username).toBe("profiletest");
        });
    });

    it("should return 401 without token", () => {
      return request(app.getHttpServer()).get("/users/profile").expect(401);
    });
  });

  describe("/users/profile (PUT)", () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      await request(app.getHttpServer()).post("/users/register").send({
        email: "update@example.com",
        username: "updatetest",
        password: "password123",
      });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "update@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.access_token;
    });

    it("should update user profile", () => {
      return request(app.getHttpServer())
        .put("/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          displayName: "Updated Name",
          locale: "pl",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.profile.displayName).toBe("Updated Name");
          expect(res.body.profile.locale).toBe("pl");
        });
    });
  });
});
