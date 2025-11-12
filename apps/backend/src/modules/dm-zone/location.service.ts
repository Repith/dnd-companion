import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationResponseDto,
} from "./dto";
import { CampaignService } from "../campaign/campaign.service";

@Injectable()
export class LocationService {
  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
  ) {}

  async create(
    createDto: CreateLocationDto,
    campaignId: string,
    userId: string,
  ): Promise<LocationResponseDto> {
    // Check if user is DM of the campaign
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can create locations");
    }

    // Validate parent location if provided
    if (createDto.parentId) {
      const parentLocation = await this.prisma.location.findUnique({
        where: { id: createDto.parentId },
      });
      if (!parentLocation) {
        throw new NotFoundException("Parent location not found");
      }
      // Check if parent location belongs to the same campaign
      const parentInCampaign = await this.prisma.campaign.findFirst({
        where: {
          id: campaignId,
          locations: { some: { id: createDto.parentId } },
        },
      });
      if (!parentInCampaign) {
        throw new BadRequestException(
          "Parent location does not belong to this campaign",
        );
      }
    }

    const location = await this.prisma.location.create({
      data: {
        ...createDto,
        campaigns: {
          connect: { id: campaignId },
        },
      },
      include: {
        npcs: true,
        quests: true,
        campaigns: true,
      },
    });

    return new LocationResponseDto({
      ...location,
      npcIds: location.npcs.map((n) => n.id),
      questIds: location.quests.map((q) => q.id),
      campaignIds: location.campaigns.map((c) => c.id),
    });
  }

  async findAll(
    campaignId: string,
    userId: string,
  ): Promise<LocationResponseDto[]> {
    // Check if user is in campaign
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const locations = await this.prisma.location.findMany({
      where: {
        campaigns: { some: { id: campaignId } },
      },
      include: {
        npcs: true,
        quests: true,
        campaigns: true,
        parent: true,
        children: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return locations.map(
      (location) =>
        new LocationResponseDto({
          ...location,
          npcIds: location.npcs.map((n) => n.id),
          questIds: location.quests.map((q) => q.id),
          campaignIds: location.campaigns.map((c) => c.id),
        }),
    );
  }

  async findById(
    id: string,
    campaignId: string,
    userId: string,
  ): Promise<LocationResponseDto | null> {
    // Check if user is in campaign
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const location = await this.prisma.location.findFirst({
      where: {
        id,
        campaigns: { some: { id: campaignId } },
      },
      include: {
        npcs: true,
        quests: true,
        campaigns: true,
        parent: true,
        children: true,
      },
    });

    if (!location) {
      return null;
    }

    return new LocationResponseDto({
      ...location,
      npcIds: location.npcs.map((n) => n.id),
      questIds: location.quests.map((q) => q.id),
      campaignIds: location.campaigns.map((c) => c.id),
    });
  }

  async update(
    id: string,
    updateDto: UpdateLocationDto,
    campaignId: string,
    userId: string,
  ): Promise<LocationResponseDto> {
    // Check if user is DM
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can update locations");
    }

    const location = await this.prisma.location.findFirst({
      where: {
        id,
        campaigns: { some: { id: campaignId } },
      },
    });

    if (!location) {
      throw new NotFoundException("Location not found");
    }

    // Validate parent location if being updated
    if (updateDto.parentId) {
      const parentLocation = await this.prisma.location.findUnique({
        where: { id: updateDto.parentId },
      });
      if (!parentLocation) {
        throw new NotFoundException("Parent location not found");
      }
      // Check if parent location belongs to the same campaign
      const parentInCampaign = await this.prisma.campaign.findFirst({
        where: {
          id: campaignId,
          locations: { some: { id: updateDto.parentId } },
        },
      });
      if (!parentInCampaign) {
        throw new BadRequestException(
          "Parent location does not belong to this campaign",
        );
      }
    }

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: updateDto,
      include: {
        npcs: true,
        quests: true,
        campaigns: true,
        parent: true,
        children: true,
      },
    });

    return new LocationResponseDto({
      ...updatedLocation,
      npcIds: updatedLocation.npcs.map((n) => n.id),
      questIds: updatedLocation.quests.map((q) => q.id),
      campaignIds: updatedLocation.campaigns.map((c) => c.id),
    });
  }

  async delete(id: string, campaignId: string, userId: string): Promise<void> {
    // Check if user is DM
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can delete locations");
    }

    const location = await this.prisma.location.findFirst({
      where: {
        id,
        campaigns: { some: { id: campaignId } },
      },
      include: {
        children: true,
      },
    });

    if (!location) {
      throw new NotFoundException("Location not found");
    }

    // Check if location has children
    if (location.children.length > 0) {
      throw new BadRequestException(
        "Cannot delete location with child locations",
      );
    }

    await this.prisma.location.delete({
      where: { id },
    });
  }

  async getHierarchy(
    campaignId: string,
    userId: string,
  ): Promise<LocationResponseDto[]> {
    // Check if user is in campaign
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    // Get all locations for the campaign
    const locations = await this.prisma.location.findMany({
      where: {
        campaigns: { some: { id: campaignId } },
      },
      include: {
        npcs: true,
        quests: true,
        campaigns: true,
        parent: true,
        children: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Build hierarchy (simple implementation - in production might want a more efficient approach)
    const locationMap = new Map<string, any>();
    const rootLocations: any[] = [];

    locations.forEach((loc) => {
      const locWithChildren = {
        ...loc,
        children: [],
        npcIds: loc.npcs.map((n) => n.id),
        questIds: loc.quests.map((q) => q.id),
        campaignIds: loc.campaigns.map((c) => c.id),
      };
      locationMap.set(loc.id, locWithChildren);

      if (!loc.parentId) {
        rootLocations.push(locWithChildren);
      }
    });

    // Build the tree
    locations.forEach((loc) => {
      if (loc.parentId) {
        const parent = locationMap.get(loc.parentId);
        if (parent) {
          parent.children.push(locationMap.get(loc.id));
        }
      }
    });

    return rootLocations.map((loc) => new LocationResponseDto(loc));
  }
}
