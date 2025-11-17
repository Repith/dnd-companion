import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UserService } from "../user/user.service";
import { LoginUserDto } from "../user/dto";
import { DemoSeederService } from "./demo-seeder.service";
import { EventBusService } from "../events/event-bus.service";

describe("AuthService", () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockDemoSeederService = {
    seedDemoData: jest.fn(),
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DemoSeederService,
          useValue: mockDemoSeederService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should validate user credentials successfully", async () => {
      const email = "test@example.com";
      const password = "password123";
      const user = {
        id: "1",
        email,
        passwordHash: "hashedPassword",
        roles: ["PLAYER"],
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.validatePassword.mockResolvedValue(true);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.validateUser(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserService.validatePassword).toHaveBeenCalledWith(
        password,
        user.passwordHash,
      );
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const email = "test@example.com";
      const password = "wrongpassword";

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("login", () => {
    it("should return access token and user data", async () => {
      const loginDto: LoginUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      const user = {
        id: "1",
        email: loginDto.email,
        roles: ["PLAYER"],
      };

      const token = "jwt-token";

      jest.spyOn(service, "validateUser").mockResolvedValue(user as any);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      });
      expect(result).toEqual({
        access_token: token,
        user,
      });
    });
  });
});
