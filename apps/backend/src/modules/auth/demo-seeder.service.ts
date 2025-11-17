2;
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  Race,
  CharacterClass,
  Alignment,
  ItemType,
  Rarity,
} from "@prisma/client";

@Injectable()
export class DemoSeederService {
  private readonly logger = new Logger(DemoSeederService.name);

  constructor(private prisma: PrismaService) {}

  async seedDemoData(userId: string): Promise<void> {
    this.logger.log(`Seeding demo data for user ${userId}`);

    // Check if demo data already exists
    const existingCharacters = await this.prisma.character.findMany({
      where: { userId: userId },
    });

    if (existingCharacters.length > 0) {
      this.logger.log("Demo data already exists, skipping seeding");
      return;
    }

    // Create sample characters
    const characters = await this.createSampleCharacters(userId);

    // Create sample campaign
    const campaign = await this.createSampleCampaign(userId, characters);

    // Create sample items
    const items = await this.createSampleItems();

    // Create inventories for characters
    await this.createSampleInventories(characters, items);

    // Create sample spells
    const spells = await this.createSampleSpells();

    // Create sample DM notes
    await this.createSampleDMNotes(userId, campaign.id, characters);

    // Create sample session
    await this.createSampleSession(campaign.id, characters);

    this.logger.log("Demo data seeding completed");
  }

  private async createSampleCharacters(userId: string) {
    const characterData = [
      {
        name: "Elara Moonwhisper",
        race: Race.ELF,
        subrace: "High Elf",
        level: 5,
        background: "Sage",
        alignment: Alignment.CHAOTIC_GOOD,
        experiencePoints: 6500,
        inspiration: true,
        hitPoints: { max: 38, current: 38, temporary: 0 },
        armorClass: 15,
        initiative: 3,
        speed: 30,
        proficiencyBonus: 3,
        featuresTraits: [
          "Darkvision",
          "Fey Ancestry",
          "Trance",
          "Spellcasting",
        ],
        personalityTraits: "I see omens in death and decay.",
        ideals:
          "Knowledge. The path to power and self-improvement is through knowledge.",
        bonds:
          "I owe my life to the priest who took me in when my parents died.",
        flaws: "I am suspicious of strangers and expect the worst of them.",
        appearance: {
          age: 127,
          height: "5'6\"",
          weight: 130,
          eyes: "silver",
          skin: "pale",
          hair: "silver",
        },
        backstory:
          "Elara was born in a small elven village but showed an aptitude for magic from a young age. She left home to study at a wizard's academy, where she discovered ancient secrets about the nature of magic itself.",
        languages: ["Common", "Elvish", "Draconic", "Dwarvish"],
        currency: { cp: 0, sp: 15, ep: 0, gp: 125, pp: 0 },
        knownSpells: [],
        preparedSpells: [],
        abilityScores: {
          strength: 8,
          dexterity: 16,
          constitution: 14,
          intelligence: 18,
          wisdom: 12,
          charisma: 10,
        },
      },
      {
        name: "Thrain Ironfist",
        race: Race.DWARF,
        subrace: "Mountain Dwarf",
        level: 4,
        background: "Soldier",
        alignment: Alignment.LAWFUL_GOOD,
        experiencePoints: 2700,
        inspiration: false,
        hitPoints: { max: 42, current: 42, temporary: 0 },
        armorClass: 18,
        initiative: 0,
        speed: 25,
        proficiencyBonus: 2,
        featuresTraits: ["Darkvision", "Dwarven Resilience", "Stonecunning"],
        personalityTraits: "I'm always polite and respectful.",
        ideals:
          "Greater Good. Our lot is to lay down our lives in defense of others.",
        bonds: "I would still lay down my life for the people I served with.",
        flaws: "I have little respect for anyone who is not a proven warrior.",
        appearance: {
          age: 85,
          height: "4'3\"",
          weight: 180,
          eyes: "dark brown",
          skin: "tan",
          hair: "red",
        },
        backstory:
          "Thrain served in the dwarven army for decades, fighting against orc invasions. After retiring, he took up adventuring to continue protecting the innocent.",
        languages: ["Common", "Dwarvish"],
        currency: { cp: 0, sp: 0, ep: 0, gp: 85, pp: 0 },
        knownSpells: [],
        preparedSpells: [],
        abilityScores: {
          strength: 18,
          dexterity: 10,
          constitution: 16,
          intelligence: 8,
          wisdom: 12,
          charisma: 14,
        },
      },
      {
        name: "Lyra Shadowstep",
        race: Race.HALF_ELF,
        level: 3,
        background: "Criminal",
        alignment: Alignment.CHAOTIC_NEUTRAL,
        experiencePoints: 900,
        inspiration: false,
        hitPoints: { max: 24, current: 24, temporary: 0 },
        armorClass: 14,
        initiative: 4,
        speed: 30,
        proficiencyBonus: 2,
        featuresTraits: ["Darkvision", "Fey Ancestry", "Skill Versatility"],
        personalityTraits: "I don't trust anyone easily.",
        ideals:
          "Freedom. Chains are meant to be broken, as are those who would forge them.",
        bonds:
          "I owe everything to my mentor, a notorious thief who taught me my trade.",
        flaws: "I steal from the rich and give to the poor... and myself.",
        appearance: {
          age: 24,
          height: "5'8\"",
          weight: 140,
          eyes: "green",
          skin: "fair",
          hair: "black",
        },
        backstory:
          "Lyra grew up on the streets, learning to survive through cunning and stealth. She joined a thieves' guild but eventually struck out on her own as an adventurer.",
        languages: ["Common", "Elvish", "Thieves' Cant"],
        currency: { cp: 0, sp: 0, ep: 0, gp: 42, pp: 0 },
        knownSpells: [],
        preparedSpells: [],
        abilityScores: {
          strength: 12,
          dexterity: 18,
          constitution: 14,
          intelligence: 10,
          wisdom: 8,
          charisma: 16,
        },
      },
    ];

    const createdCharacters = [];
    for (const charData of characterData) {
      const { abilityScores, ...charWithoutScores } = charData;
      const character = await this.prisma.character.create({
        data: {
          ...charWithoutScores,
          userId: userId,
          isDemo: true,
          abilityScores: {
            create: abilityScores,
          },
        },
      });
      createdCharacters.push(character);
    }

    return createdCharacters;
  }

  private async createSampleCampaign(userId: string, characters: any[]) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: "The Forgotten Realms Adventure",
        description:
          "A grand adventure through the Sword Coast, filled with mystery, danger, and untold treasures.",
        dmId: userId,
        players: {
          connect: [], // Demo user is both DM and player
        },
        activePlayers: {
          connect: characters.map((c) => ({ id: c.id })),
        },
      },
    });

    // Update characters to be part of the campaign
    for (const character of characters) {
      await this.prisma.character.update({
        where: { id: character.id },
        data: { campaignId: campaign.id },
      });
    }

    return campaign;
  }

  private async createSampleItems() {
    const items = [
      {
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
        properties: {
          damage: "1d8 slashing",
          damageType: "slashing",
        },
        description: "A versatile sword with a sharp blade.",
      },
      {
        name: "Chain Mail",
        type: ItemType.ARMOR,
        rarity: Rarity.UNCOMMON,
        weight: 55,
        properties: {
          armorClass: 16,
        },
        description: "Interlocking metal rings provide good protection.",
      },
      {
        name: "Spellbook",
        type: ItemType.MAGIC_ITEM,
        rarity: Rarity.COMMON,
        weight: 3,
        description: "A book containing arcane spells and knowledge.",
      },
      {
        name: "Health Potion",
        type: ItemType.CONSUMABLE,
        rarity: Rarity.COMMON,
        weight: 0.5,
        properties: {
          healing: "2d4 + 2",
        },
        description: "A magical potion that restores health when consumed.",
      },
      {
        name: "Dagger",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 1,
        properties: {
          damage: "1d4 piercing",
          damageType: "piercing",
        },
        description: "A small, concealable blade.",
      },
    ];

    const createdItems = [];
    for (const itemData of items) {
      const item = await this.prisma.item.create({
        data: itemData,
      });
      createdItems.push(item);
    }

    return createdItems;
  }

  private async createSampleInventories(characters: any[], items: any[]) {
    for (const character of characters) {
      const inventory = await this.prisma.inventory.create({
        data: {
          ownerType: "CHARACTER",
          ownerId: character.id,
        },
      });

      // Add some items to each character's inventory
      const characterItems = items.slice(0, Math.min(3, items.length));
      for (const item of characterItems) {
        await this.prisma.inventoryItem.create({
          data: {
            inventoryId: inventory.id,
            itemId: item.id,
            quantity: 1,
            equipped:
              character.name === "Thrain Ironfist" &&
              item.name === "Chain Mail",
          },
        });
      }
    }
  }

  private async createSampleSpells() {
    const spells = [
      {
        name: "Magic Missile",
        level: 1,
        school: "EVOCATION" as const,
        castingTime: "1 action",
        range: "120 feet",
        components: { verbal: true, somatic: true },
        duration: { duration: "Instantaneous" },
        classes: ["Wizard", "Sorcerer"],
        description:
          "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.",
      },
      {
        name: "Shield",
        level: 1,
        school: "ABJURATION" as const,
        castingTime: "1 reaction",
        range: "Self",
        components: { verbal: true, somatic: true },
        duration: { duration: "1 round" },
        classes: ["Wizard", "Sorcerer"],
        description:
          "An invisible barrier of magical force appears and protects you.",
      },
      {
        name: "Cure Wounds",
        level: 1,
        school: "EVOCATION" as const,
        castingTime: "1 action",
        range: "Touch",
        components: { verbal: true, somatic: true },
        duration: { duration: "Instantaneous" },
        classes: ["Cleric", "Druid", "Paladin", "Ranger"],
        description:
          "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.",
      },
    ];

    for (const spellData of spells) {
      await this.prisma.spell.create({
        data: spellData,
      });
    }

    return spells;
  }

  private async createSampleDMNotes(
    userId: string,
    campaignId: string,
    characters: any[],
  ) {
    const notes = [
      {
        content:
          "The party has discovered an ancient ruin in the Sword Coast. The entrance is hidden behind a waterfall. Inside, they found strange markings that glow with arcane energy.",
        links: [
          {
            relatedEntityType: "Campaign",
            relatedEntityId: campaignId,
            relationship: "location_discovery",
          },
        ],
      },
      {
        content:
          "Elara's player mentioned wanting to research the arcane markings. This could lead to a subplot about an ancient wizard's tower nearby.",
        links: [
          {
            relatedEntityType: "Character",
            relatedEntityId: characters[0].id,
            relationship: "character_development",
          },
        ],
      },
      {
        content:
          "Thrain has been unusually quiet during sessions. Consider giving him a personal quest related to his dwarven heritage.",
        links: [
          {
            relatedEntityType: "Character",
            relatedEntityId: characters[1].id,
            relationship: "character_arc",
          },
        ],
      },
    ];

    for (const noteData of notes) {
      const note = await this.prisma.dMNote.create({
        data: {
          content: noteData.content,
        },
      });

      for (const linkData of noteData.links) {
        await this.prisma.link.create({
          data: {
            noteId: note.id,
            ...linkData,
          },
        });
      }
    }
  }

  private async createSampleSession(campaignId: string, characters: any[]) {
    const session = await this.prisma.session.create({
      data: {
        campaignId,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        notes:
          "The party explored the ancient ruins and fought a group of animated skeletons. They discovered a magical amulet but also alerted some guardians.",
        playerCharacterIds: characters.map((c) => c.id),
      },
    });

    // Create some sample events
    const events = [
      {
        type: "DAMAGE_APPLIED" as const,
        actorId: characters[1].id, // Thrain
        targetId: characters[0].id, // Elara (friendly fire example)
        payload: {
          damage: 5,
          damageType: "slashing",
          description: "Sword swing",
        },
      },
      {
        type: "HEALING_RECEIVED" as const,
        actorId: characters[0].id, // Elara
        targetId: characters[1].id, // Thrain
        payload: { healing: 8, description: "Cure Wounds spell" },
      },
      {
        type: "ITEM_GIVEN" as const,
        actorId: characters[0].id, // Elara
        targetId: characters[2].id, // Lyra
        payload: { itemName: "Health Potion", quantity: 1 },
      },
    ];

    for (const eventData of events) {
      await this.prisma.gameEvent.create({
        data: {
          ...eventData,
          sessionId: session.id,
        },
      });
    }

    return session;
  }
}
