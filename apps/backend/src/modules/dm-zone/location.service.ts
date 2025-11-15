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
    userId: string,
  ): Promise<LocationResponseDto> {
    // Validate parent location if provided
    if (createDto.parentId) {
      const parentLocation = await this.prisma.location.findUnique({
        where: { id: createDto.parentId },
      });
      if (!parentLocation) {
        throw new NotFoundException("Parent location not found");
      }
    }

    const location = await this.prisma.location.create({
      data: {
        ...createDto,
        creatorId: userId,
        visibility: "PUBLIC",
      } as any,
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

  async findAll(userId: string): Promise<LocationResponseDto[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        OR: [{ visibility: "PUBLIC" }, { creatorId: userId }],
      } as any,
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
    userId: string,
  ): Promise<LocationResponseDto | null> {
    const location = await this.prisma.location.findUnique({
      where: { id },
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

    const loc = location as any;
    if (loc.visibility !== "PUBLIC" && loc.creatorId !== userId) {
      throw new ForbiddenException("You don't have access to this location");
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
    userId: string,
  ): Promise<LocationResponseDto> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const loc = location as any;
    if (loc.visibility !== "PUBLIC" && loc.creatorId !== userId) {
      throw new ForbiddenException("You don't have access to this location");
    }

    // Validate parent location if being updated
    if (updateDto.parentId) {
      const parentLocation = await this.prisma.location.findUnique({
        where: { id: updateDto.parentId },
      });
      if (!parentLocation) {
        throw new NotFoundException("Parent location not found");
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

  async delete(id: string, userId: string): Promise<void> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const loc = location as any;
    if (loc.visibility !== "PUBLIC" && loc.creatorId !== userId) {
      throw new ForbiddenException("You don't have access to this location");
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

  async getHierarchy(userId: string): Promise<LocationResponseDto[]> {
    // Get all accessible locations
    const locations = await this.prisma.location.findMany({
      where: {
        OR: [{ visibility: "PUBLIC" }, { creatorId: userId }],
      } as any,
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
