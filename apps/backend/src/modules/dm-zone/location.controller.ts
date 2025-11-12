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

@Controller("campaigns/:campaignId/locations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @Roles(Role.DM)
  async create(
    @Param("campaignId") campaignId: string,
    @Body() createDto: CreateLocationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto> {
    return this.locationService.create(createDto, campaignId, req.user.id);
  }

  @Get()
  async findAll(
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto[]> {
    return this.locationService.findAll(campaignId, req.user.id);
  }

  @Get("hierarchy")
  async getHierarchy(
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto[]> {
    return this.locationService.getHierarchy(campaignId, req.user.id);
  }

  @Get(":id")
  async findById(
    @Param("id") id: string,
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto | null> {
    return this.locationService.findById(id, campaignId, req.user.id);
  }

  @Put(":id")
  @Roles(Role.DM)
  async update(
    @Param("id") id: string,
    @Param("campaignId") campaignId: string,
    @Body() updateDto: UpdateLocationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LocationResponseDto> {
    return this.locationService.update(id, updateDto, campaignId, req.user.id);
  }

  @Delete(":id")
  @Roles(Role.DM)
  async delete(
    @Param("id") id: string,
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.locationService.delete(id, campaignId, req.user.id);
  }
}
