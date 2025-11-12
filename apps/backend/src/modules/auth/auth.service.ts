import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { LoginUserDto } from "../user/dto/login-user.dto";

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
}
