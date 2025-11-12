import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { LoginUserDto } from "../user/dto/login-user.dto";
import { Role } from "../../common/types";
import { DemoSeederService } from "./demo-seeder.service";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private demoSeederService: DemoSeederService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.error(`User validation failed: user not found for email`, {
        email,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`User validation failed: invalid password for user`, {
        userId: user.id,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Update last login
    await this.userService.updateLastLogin(user.id);

    this.logger.log(`User validated successfully`, {
      userId: user.id,
      email: user.email,
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    this.logger.log(`User logged in successfully`, {
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      this.logger.warn(`JWT validation failed: user not found`, {
        userId: payload.sub,
      });
      throw new UnauthorizedException("User not found");
    }

    this.logger.log(`JWT validated successfully`, {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  async demoLogin(): Promise<any> {
    // Create or get demo user
    let demoUser = await this.userService.findByEmail("demo@dnd-companion.com");

    if (!demoUser) {
      this.logger.log("Creating demo user");
      const createdUser = await this.userService.create({
        email: "demo@dnd-companion.com",
        username: "demo",
        password: "demo123",
        displayName: "Demo User",
        roles: [Role.PLAYER],
      });
      // Get the raw user data after creation
      demoUser = await this.userService.findByEmail("demo@dnd-companion.com");
    }

    if (!demoUser) {
      throw new UnauthorizedException("Failed to create or find demo user");
    }

    // Mark as demo user
    (demoUser as any).isDemo = true;

    // Seed demo data for the user
    await this.demoSeederService.seedDemoData(demoUser.id);

    const payload: JwtPayload = {
      sub: demoUser.id,
      email: demoUser.email,
      roles: demoUser.roles,
    };

    this.logger.log(`Demo login successful`, {
      userId: demoUser.id,
      email: demoUser.email,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: demoUser,
    };
  }
}
