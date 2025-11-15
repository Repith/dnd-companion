import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthenticatedRequest, Role } from "../../common/types";
import { LocationService } from "./location.service";
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationResponseDto,
} from "./dto";

@Controller("locations")
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  async create(
    @Body() createDto: CreateLocationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto> {
    return this.locationService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto[]> {
    return this.locationService.findAll(req.user.id);
  }

  @Get("hierarchy")
  async getHierarchy(
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto[]> {
    return this.locationService.getHierarchy(req.user.id);
  }

  @Get(":id")
  async findById(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto | null> {
    return this.locationService.findById(id, req.user.id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateLocationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto> {
    return this.locationService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.locationService.delete(id, req.user.id);
  }
}
