import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "../user/dto/login-user.dto";

@Controller("auth")
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }
}
