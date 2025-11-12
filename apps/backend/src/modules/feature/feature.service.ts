import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateFeatureDto, UpdateFeatureDto, FeatureResponseDto } from "./dto";

@Injectable()
export class FeatureService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate feature data
   */
  private validateFeatureData(
    data: Partial<CreateFeatureDto | UpdateFeatureDto>,
  ): void {
    // Validate level if provided
    if (data.level !== undefined && data.level < 1) {
      throw new BadRequestException("Feature level must be at least 1");
    }
  }

  /**
   * Create a new feature
   */
  async create(createDto: CreateFeatureDto): Promise<FeatureResponseDto> {
    this.validateFeatureData(createDto);

    // Check if feature with same name already exists
    const existingFeature = await this.prisma.feature.findFirst({
      where: { name: createDto.name },
    });

    if (existingFeature) {
      throw new BadRequestException("Feature with this name already exists");
    }

    const feature = await this.prisma.feature.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        source: createDto.source,
        ...(createDto.level !== undefined && { level: createDto.level }),
      },
    });

    return this.mapToResponseDto(feature);
  }

  /**
   * Find all features with optional filtering
   */
  async findAll(filters?: {
    level?: number;
    source?: string;
    search?: string;
  }): Promise<FeatureResponseDto[]> {
    const where: any = {};

    if (filters?.level !== undefined) {
      where.level = filters.level;
    }

    if (filters?.source) {
      where.source = { contains: filters.source, mode: "insensitive" };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const features = await this.prisma.feature.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return features.map((feature) => this.mapToResponseDto(feature));
  }

  /**
   * Find a single feature by ID
   */
  async findOne(id: string): Promise<FeatureResponseDto> {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException("Feature not found");
    }

    return this.mapToResponseDto(feature);
  }

  /**
   * Update a feature
   */
  async update(
    id: string,
    updateDto: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> {
    this.validateFeatureData(updateDto);

    // Check if feature exists
    const existingFeature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      throw new NotFoundException("Feature not found");
    }

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== existingFeature.name) {
      const nameConflict = await this.prisma.feature.findFirst({
        where: { name: updateDto.name },
      });
      if (nameConflict) {
        throw new BadRequestException("Feature with this name already exists");
      }
    }

    const updatedFeature = await this.prisma.feature.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
        ...(updateDto.source !== undefined && { source: updateDto.source }),
        ...(updateDto.level !== undefined && { level: updateDto.level }),
      },
    });

    return this.mapToResponseDto(updatedFeature);
  }

  /**
   * Delete a feature
   */
  async remove(id: string): Promise<void> {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException("Feature not found");
    }

    // Check if feature is being used by any characters
    const charactersUsingFeature = await this.prisma.character.count({
      where: {
        features: {
          some: { id },
        },
      },
    });

    if (charactersUsingFeature > 0) {
      throw new BadRequestException(
        "Cannot delete feature that is currently assigned to characters",
      );
    }

    await this.prisma.feature.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma feature to response DTO
   */
  private mapToResponseDto(feature: any): FeatureResponseDto {
    return {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      source: feature.source,
      level: feature.level,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
    };
  }
}
