import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { ItemRepository } from "@dnd-companion/domain";
import { Item } from "@dnd-companion/domain";
import { ItemType, Rarity } from "@dnd-companion/domain";

@Injectable()
export class ItemRepositoryImpl implements ItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Item | null> {
    const prismaItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!prismaItem) {
      return null;
    }

    return this.mapToDomain(prismaItem);
  }

  async save(item: Item): Promise<void> {
    const data = this.mapToPrisma(item);

    await this.prisma.item.upsert({
      where: { id: item.id },
      update: data,
      create: { ...data, id: item.id },
    });
  }

  async findAll(): Promise<Item[]> {
    const prismaItems = await this.prisma.item.findMany();

    return prismaItems.map((item) => this.mapToDomain(item));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaItem: any): Item {
    return new Item(
      prismaItem.id,
      prismaItem.name,
      prismaItem.type as ItemType,
      prismaItem.rarity as Rarity,
      prismaItem.weight || 0,
      prismaItem.properties,
      prismaItem.effects,
      prismaItem.source,
      prismaItem.description,
    );
  }

  private mapToPrisma(item: Item): any {
    return {
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      weight: item.weight,
      properties: item.properties,
      effects: item.effects,
      source: item.source,
      description: item.description,
    };
  }
}
