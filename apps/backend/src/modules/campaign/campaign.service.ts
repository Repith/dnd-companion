import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
} from "./dto";

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateCampaignDto,
    dmId: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.prisma.campaign.create({
      data: {
        ...createDto,
        dmId,
      },
    });

    return new CampaignResponseDto(campaign);
  }

  async findAll(): Promise<CampaignResponseDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return campaigns.map((campaign) => new CampaignResponseDto(campaign));
  }

  async findById(id: string): Promise<CampaignResponseDto | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        quests: true,
        sessions: true,
        npcs: true,
        locations: true,
        players: true,
      },
    });

    if (!campaign) {
      return null;
    }

    return new CampaignResponseDto({
      ...campaign,
      playerIds: campaign.players.map((p) => p.id),
      questIds: campaign.quests.map((q) => q.id),
      npcIds: campaign.npcs.map((n) => n.id),
      locationIds: campaign.locations.map((l) => l.id),
    });
  }

  async findByUser(userId: string): Promise<CampaignResponseDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        OR: [{ dmId: userId }, { players: { some: { id: userId } } }],
      },
      include: {
        quests: true,
        sessions: true,
        npcs: true,
        locations: true,
        players: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return campaigns.map(
      (campaign) =>
        new CampaignResponseDto({
          ...campaign,
          playerIds: campaign.players.map((p) => p.id),
          questIds: campaign.quests.map((q) => q.id),
          npcIds: campaign.npcs.map((n) => n.id),
          locationIds: campaign.locations.map((l) => l.id),
        }),
    );
  }

  async update(
    id: string,
    updateDto: UpdateCampaignDto,
    userId: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.dmId !== userId) {
      throw new ForbiddenException("Only the DM can update the campaign");
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: updateDto,
    });

    return new CampaignResponseDto(updatedCampaign);
  }

  async delete(id: string, userId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.dmId !== userId) {
      throw new ForbiddenException("Only the DM can delete the campaign");
    }

    await this.prisma.campaign.delete({
      where: { id },
    });
  }

  async addPlayer(
    campaignId: string,
    playerId: string,
    dmId: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.dmId !== dmId) {
      throw new ForbiddenException(
        "Only the DM can add players to the campaign",
      );
    }

    const player = await this.prisma.user.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException("Player not found");
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        players: {
          connect: { id: playerId },
        },
      },
      include: {
        players: true,
        quests: true,
        sessions: true,
        npcs: true,
        locations: true,
      },
    });

    return new CampaignResponseDto({
      ...updatedCampaign,
      playerIds: updatedCampaign.players.map((p) => p.id),
      questIds: updatedCampaign.quests.map((q) => q.id),
      npcIds: updatedCampaign.npcs.map((n) => n.id),
      locationIds: updatedCampaign.locations.map((l) => l.id),
    });
  }

  async removePlayer(
    campaignId: string,
    playerId: string,
    dmId: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.dmId !== dmId) {
      throw new ForbiddenException(
        "Only the DM can remove players from the campaign",
      );
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        players: {
          disconnect: { id: playerId },
        },
      },
      include: {
        players: true,
        quests: true,
        sessions: true,
        npcs: true,
        locations: true,
      },
    });

    return new CampaignResponseDto({
      ...updatedCampaign,
      playerIds: updatedCampaign.players.map((p) => p.id),
      questIds: updatedCampaign.quests.map((q) => q.id),
      npcIds: updatedCampaign.npcs.map((n) => n.id),
      locationIds: updatedCampaign.locations.map((l) => l.id),
    });
  }

  async isUserInCampaign(campaignId: string, userId: string): Promise<boolean> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        players: true,
      },
    });

    if (!campaign) {
      return false;
    }

    return (
      campaign.dmId === userId || campaign.players.some((p) => p.id === userId)
    );
  }

  async isUserDM(campaignId: string, userId: string): Promise<boolean> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    return campaign?.dmId === userId;
  }
}
