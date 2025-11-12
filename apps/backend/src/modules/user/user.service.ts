import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { Role } from "@/common/types";
import { User } from "@prisma/client";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async create(registerDto: RegisterUserDto): Promise<UserResponseDto> {
    const {
      email,
      username,
      password,
      roles = [Role.PLAYER],
      displayName,
      locale,
    } = registerDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      this.logger.warn(`User creation failed: email already exists`, { email });
      throw new ConflictException("User with this email already exists");
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      this.logger.warn(`User creation failed: username already exists`, {
        username,
      });
      throw new ConflictException("User with this username already exists");
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create profile object
    const profile =
      displayName || locale
        ? {
            displayName: displayName || username,
            avatarUrl: null,
            locale: locale || "en",
          }
        : null;

    // Create user
    const userData: any = {
      email,
      username,
      passwordHash,
      roles,
    };

    if (profile) {
      userData.profile = profile;
    }

    const user = await this.prisma.user.create({
      data: userData,
    });

    this.logger.log(`User created successfully`, {
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return new UserResponseDto(user as any);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      this.logger.log(`User found by email`, { email });
    } else {
      this.logger.warn(`User not found by email`, { email });
    }

    return user;
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User not found by ID`, { userId: id });
      return null;
    }

    this.logger.log(`User found by ID`, { userId: id });
    return new UserResponseDto(user as any);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      this.logger.log(`Password validation successful`);
    } else {
      this.logger.warn(`Password validation failed`);
    }
    return isValid;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    this.logger.log(`User last login updated`, { userId });
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    this.logger.log(`Retrieved all users`, { count: users.length });

    return users.map(
      (user: User) => new UserResponseDto(user as UserResponseDto),
    );
  }

  async updateProfile(
    userId: string,
    updateData: Partial<{
      displayName: string;
      locale: string;
      avatarUrl: string;
    }>,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User profile update failed: user not found`, {
        userId,
      });
      throw new NotFoundException("User not found");
    }

    const updatedProfile = user.profile
      ? { ...(user.profile as any), ...updateData }
      : updateData;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profile: updatedProfile },
    });

    this.logger.log(`User profile updated successfully`, {
      userId,
      updatedFields: Object.keys(updateData),
    });

    return new UserResponseDto(updatedUser as any);
  }

  async assignRoles(userId: string, roles: Role[]): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Role assignment failed: user not found`, { userId });
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });

    this.logger.log(`User roles assigned successfully`, { userId, roles });

    return new UserResponseDto(updatedUser as any);
  }
}
