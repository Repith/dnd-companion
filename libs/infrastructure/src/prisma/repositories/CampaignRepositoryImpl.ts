import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CampaignRepository } from "@dnd-companion/domain";
import { Campaign } from "@dnd-companion/domain";
import { CampaignStatus } from "@dnd-companion/domain";

@Injectable()
export class CampaignRepositoryImpl implements CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Campaign | null> {
    const prismaCampaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!prismaCampaign) {
      return null;
    }

    return this.mapToDomain(prismaCampaign);
  }

  async save(campaign: Campaign): Promise<void> {
    const data = this.mapToPrisma(campaign);

    await this.prisma.campaign.upsert({
      where: { id: campaign.id },
      update: data,
      create: { ...data, id: campaign.id },
    });
  }

  async findAll(): Promise<Campaign[]> {
    const prismaCampaigns = await this.prisma.campaign.findMany();

    return prismaCampaigns.map((campaign) => this.mapToDomain(campaign));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.campaign.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaCampaign: any): Campaign {
    return new Campaign(
      prismaCampaign.id,
      prismaCampaign.name,
      prismaCampaign.status as CampaignStatus,
    );
  }

  private mapToPrisma(campaign: Campaign): any {
    return {
      name: campaign.name,
      status: campaign.status,
    };
  }
}
