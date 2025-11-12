import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
  ForbiddenException,
} from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth";
import { AuthenticatedRequest } from "../../common/types";

@Controller("campaigns")
@UsePipes(new ValidationPipe({ transform: true }))
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createDto: CreateCampaignDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.create(createDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto[]> {
    return this.campaignService.findByUser(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.campaignService.findById(id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      id,
      req.user.id,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    return campaign;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateCampaignDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.campaignService.delete(id, req.user.id);
  }

  @Post(":id/players/:playerId")
  @UseGuards(JwtAuthGuard)
  async addPlayer(
    @Param("id") campaignId: string,
    @Param("playerId") playerId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.addPlayer(campaignId, playerId, req.user.id);
  }

  @Delete(":id/players/:playerId")
  @UseGuards(JwtAuthGuard)
  async removePlayer(
    @Param("id") campaignId: string,
    @Param("playerId") playerId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.removePlayer(campaignId, playerId, req.user.id);
  }
}
