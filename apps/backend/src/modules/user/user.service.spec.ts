import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RegisterUserDto, Role } from "./dto";

const bcrypt = require("bcrypt");

describe("UserService", () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        username: "testuser",
        password: "password123",
        roles: [Role.PLAYER],
      };

      const hashedPassword = "hashedPassword";
      const createdUser = {
        id: "1",
        email: registerDto.email,
        username: registerDto.username,
        passwordHash: hashedPassword,
        roles: registerDto.roles,
        subscriptionTier: "FREE",
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      jest.spyOn(bcrypt, "hash").mockResolvedValue(hashedPassword);

      const result = await service.create(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { username: registerDto.username },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          passwordHash: hashedPassword,
          roles: registerDto.roles,
        },
      });
      expect(result).toMatchObject({
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        roles: createdUser.roles,
        subscriptionTier: createdUser.subscriptionTier,
        profile: undefined,
        lastLogin: createdUser.lastLogin,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
    });

    it("should throw ConflictException if email already exists", async () => {
      const registerDto: RegisterUserDto = {
        email: "existing@example.com",
        username: "existinguser",
        password: "password123",
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: "1",
        email: registerDto.email,
      });

      await expect(service.create(registerDto)).rejects.toThrow(
        "User with this email already exists",
      );
    });

    it("should throw ConflictException if username already exists", async () => {
      const registerDto: RegisterUserDto = {
        email: "new@example.com",
        username: "existinguser",
        password: "password123",
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({
          id: "1",
          username: registerDto.username,
        });

      await expect(service.create(registerDto)).rejects.toThrow(
        "User with this username already exists",
      );
    });
  });

  describe("validatePassword", () => {
    it("should validate password correctly", async () => {
      const password = "password123";
      const hash = "hashedPassword";

      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const result = await service.validatePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });
  });

  describe("findByEmail", () => {
    it("should return user by email", async () => {
      const email = "test@example.com";
      const user = { id: "1", email };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBe(user);
    });
  });
});
