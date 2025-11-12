import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateGeneratorRequestDto,
  GeneratorRequestResponseDto,
  GeneratedEntityResponseDto,
  GeneratorType,
  GeneratorStatus,
} from "./dto";

@Injectable()
export class GeneratorService {
  constructor(private prisma: PrismaService) {}

  async createRequest(
    createDto: CreateGeneratorRequestDto,
  ): Promise<GeneratorRequestResponseDto> {
    const request = await this.prisma.generatorRequest.create({
      data: {
        type: createDto.type,
        tags: createDto.tags || [],
        ...(createDto.prompt !== undefined && { prompt: createDto.prompt }),
      },
    });

    // Start generation process asynchronously
    this.processGeneration(request.id);

    return new GeneratorRequestResponseDto(request);
  }

  async findAllRequests(): Promise<GeneratorRequestResponseDto[]> {
    const requests = await this.prisma.generatorRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return requests.map((req) => new GeneratorRequestResponseDto(req));
  }

  async findRequestById(id: string): Promise<GeneratorRequestResponseDto> {
    const request = await this.prisma.generatorRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Generator request not found");
    }

    return new GeneratorRequestResponseDto(request);
  }

  async findGeneratedEntityById(
    id: string,
  ): Promise<GeneratedEntityResponseDto> {
    const entity = await this.prisma.generatedEntity.findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException("Generated entity not found");
    }

    return new GeneratedEntityResponseDto(entity);
  }

  private async processGeneration(requestId: string): Promise<void> {
    try {
      // Update status to IN_PROGRESS
      await this.prisma.generatorRequest.update({
        where: { id: requestId },
        data: { status: GeneratorStatus.IN_PROGRESS },
      });

      const request = await this.prisma.generatorRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error("Request not found");
      }

      // Generate the entity based on type
      const generatedData = await this.generateEntity(request);

      // Create the generated entity
      const generatedEntity = await this.prisma.generatedEntity.create({
        data: {
          entityType: request.type,
          data: generatedData,
        },
      });

      // Update request with result
      await this.prisma.generatorRequest.update({
        where: { id: requestId },
        data: {
          status: GeneratorStatus.COMPLETED,
          resultId: generatedEntity.id,
        },
      });
    } catch (error) {
      // Update status to FAILED
      await this.prisma.generatorRequest.update({
        where: { id: requestId },
        data: { status: GeneratorStatus.FAILED },
      });
      throw error;
    }
  }

  private async generateEntity(request: any): Promise<any> {
    // For now, implement basic template-based generation
    // This will be replaced with AI integration later

    switch (request.type) {
      case GeneratorType.NPC:
        return this.generateNPC(request);
      case GeneratorType.LOCATION:
        return this.generateLocation(request);
      case GeneratorType.ITEM:
        return this.generateItem(request);
      case GeneratorType.SPELL:
        return this.generateSpell(request);
      case GeneratorType.CAMPAIGN:
        return this.generateCampaign(request);
      default:
        throw new BadRequestException("Unsupported generator type");
    }
  }

  private generateNPC(request: any): any {
    // Basic NPC template generation
    const names = ["Aldric", "Brynna", "Caspian", "Dara", "Eldrin"];
    const races = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn"];
    const classes = ["Fighter", "Wizard", "Rogue", "Cleric", "Barbarian"];

    return {
      name: names[Math.floor(Math.random() * names.length)],
      race: races[Math.floor(Math.random() * races.length)],
      class: classes[Math.floor(Math.random() * classes.length)],
      level: Math.floor(Math.random() * 20) + 1,
      background: "Generated NPC",
      alignment: "Neutral",
      personalityTraits: ["Friendly", "Curious"],
      tags: request.tags,
    };
  }

  private generateLocation(request: any): any {
    const types = ["City", "Dungeon", "Forest", "Castle", "Village"];
    const descriptions = [
      "A bustling metropolis",
      "An ancient ruin filled with mystery",
      "A dense woodland with hidden secrets",
    ];

    return {
      name: `Generated ${types[Math.floor(Math.random() * types.length)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      description:
        descriptions[Math.floor(Math.random() * descriptions.length)],
      tags: request.tags,
    };
  }

  private generateItem(request: any): any {
    const types = ["Weapon", "Armor", "Potion", "Artifact"];
    const rarities = ["Common", "Uncommon", "Rare", "Very Rare"];

    return {
      name: `Generated ${types[Math.floor(Math.random() * types.length)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      description: "A randomly generated item",
      tags: request.tags,
    };
  }

  private generateSpell(request: any): any {
    const schools = ["Evocation", "Conjuration", "Divination", "Enchantment"];

    return {
      name: "Generated Spell",
      level: Math.floor(Math.random() * 10),
      school: schools[Math.floor(Math.random() * schools.length)],
      castingTime: "1 action",
      range: "60 feet",
      components: { verbal: true, somatic: true },
      duration: "Instantaneous",
      description: "A randomly generated spell",
      tags: request.tags,
    };
  }

  private generateCampaign(request: any): any {
    return {
      name: "Generated Campaign",
      description: "A randomly generated campaign setting",
      tags: request.tags,
    };
  }

  // Skeleton for AI integration
  private async generateWithAI(request: any): Promise<any> {
    // TODO: Implement OpenAI integration
    // This would call OpenAI API with the prompt and tags
    // For now, return the basic template generation
    return this.generateEntity(request);
  }
}
