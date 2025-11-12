import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { GeneratorService } from "./generator.service";
import {
  CreateGeneratorRequestDto,
  GeneratorRequestResponseDto,
  GeneratedEntityResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth";

@Controller("generator")
@UsePipes(new ValidationPipe({ transform: true }))
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post("requests")
  @UseGuards(JwtAuthGuard)
  async createRequest(
    @Body() createDto: CreateGeneratorRequestDto,
  ): Promise<GeneratorRequestResponseDto> {
    return this.generatorService.createRequest(createDto);
  }

  @Get("requests")
  @UseGuards(JwtAuthGuard)
  async findAllRequests(): Promise<GeneratorRequestResponseDto[]> {
    return this.generatorService.findAllRequests();
  }

  @Get("requests/:id")
  @UseGuards(JwtAuthGuard)
  async findRequestById(
    @Param("id") id: string,
  ): Promise<GeneratorRequestResponseDto> {
    return this.generatorService.findRequestById(id);
  }

  @Get("entities/:id")
  @UseGuards(JwtAuthGuard)
  async findGeneratedEntityById(
    @Param("id") id: string,
  ): Promise<GeneratedEntityResponseDto> {
    return this.generatorService.findGeneratedEntityById(id);
  }
}
