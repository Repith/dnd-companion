import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../../common/types";
import { UserService } from "./user.service";
import { JwtAuthGuard, RolesGuard, Roles, AuthService } from "../auth";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { Role } from "./dto/types";

@Controller("users")
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post("register")
  async register(
    @Body() registerDto: RegisterUserDto,
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    await this.userService.create(registerDto);
    return this.authService.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body()
    updateData: { displayName?: string; locale?: string; avatarUrl?: string },
  ): Promise<UserResponseDto> {
    return this.userService.updateProfile(req.user.id, updateData);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  @Put(":id/roles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignRoles(
    @Param("id") id: string,
    @Body() data: { roles: Role[] },
  ): Promise<UserResponseDto> {
    return this.userService.assignRoles(id, data.roles);
  }
}
