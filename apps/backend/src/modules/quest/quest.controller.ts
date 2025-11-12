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
import { AuthenticatedRequest } from "../../common/types";
import { QuestService } from "./quest.service";
import {
  CreateQuestDto,
  UpdateQuestDto,
  QuestResponseDto,
  QuestStatus,
} from "./dto";
import { JwtAuthGuard } from "../auth";

@Controller("campaigns/:campaignId/quests")
@UsePipes(new ValidationPipe({ transform: true }))
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param("campaignId") campaignId: string,
    @Body() createDto: CreateQuestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<QuestResponseDto> {
    return this.questService.create(createDto, campaignId, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param("campaignId") campaignId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<QuestResponseDto[]> {
    return this.questService.findAll(campaignId, req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<QuestResponseDto> {
    const quest = await this.questService.findById(id, req.user.id);
    if (!quest) {
      throw new Error("Quest not found");
    }
    return quest;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateQuestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<QuestResponseDto> {
    return this.questService.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.questService.delete(id, req.user.id);
  }

  @Post(":id/progress")
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @Param("id") questId: string,
    @Body() data: { characterId: string; status: QuestStatus },
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.questService.updateProgress(
      questId,
      data.characterId,
      data.status,
      req.user.id,
    );
  }

  @Post(":id/rewards")
  @UseGuards(JwtAuthGuard)
  async awardRewards(
    @Param("id") questId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.questService.awardRewards(questId, req.user.id);
  }
}
