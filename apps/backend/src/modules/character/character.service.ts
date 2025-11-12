import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import {
  EventType,
  DamageAppliedEvent,
  HealingReceivedEvent,
  LevelUpEvent,
  DeathEvent,
} from "../events/dto";
import {
  CreateCharacterDto,
  UpdateCharacterDto,
  CharacterResponseDto,
  SkillName,
  AbilityName,
} from "./dto";

@Injectable()
export class CharacterService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Calculate proficiency bonus based on character level
   */
  private calculateProficiencyBonus(level: number): number {
    return Math.floor((level - 1) / 4) + 2;
  }

  /**
   * Calculate ability modifier from score
   */
  private calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Validate DnD rules for character creation/update
   */
  private validateDnDRules(
    data: Partial<CreateCharacterDto | UpdateCharacterDto>,
  ): void {
    // Validate ability scores are within 3-20 range
    if (data.abilityScores) {
      const scores = [
        data.abilityScores.strength,
        data.abilityScores.dexterity,
        data.abilityScores.constitution,
        data.abilityScores.intelligence,
        data.abilityScores.wisdom,
        data.abilityScores.charisma,
      ];

      for (const score of scores) {
        if (score < 3 || score > 20) {
          throw new BadRequestException(
            "Ability scores must be between 3 and 20",
          );
        }
      }
    }

    // Validate level progression
    if (data.level !== undefined) {
      if (data.level < 1 || data.level > 20) {
        throw new BadRequestException(
          "Character level must be between 1 and 20",
        );
      }
    }

    // Validate experience points
    if (data.experiencePoints !== undefined && data.experiencePoints < 0) {
      throw new BadRequestException("Experience points cannot be negative");
    }

    // Validate hit points
    if (data.hitPoints) {
      if (data.hitPoints.max < 1) {
        throw new BadRequestException("Maximum hit points must be at least 1");
      }
      if (
        data.hitPoints.current < 0 ||
        data.hitPoints.current > data.hitPoints.max
      ) {
        throw new BadRequestException(
          "Current hit points must be between 0 and maximum",
        );
      }
      if (data.hitPoints.temporary < 0) {
        throw new BadRequestException(
          "Temporary hit points cannot be negative",
        );
      }
    }

    // Validate armor class
    if (data.armorClass !== undefined) {
      if (data.armorClass < 5 || data.armorClass > 25) {
        throw new BadRequestException("Armor class must be between 5 and 25");
      }
    }

    // Validate speed
    if (data.speed !== undefined) {
      if (data.speed < 5 || data.speed > 120) {
        throw new BadRequestException("Speed must be between 5 and 120 feet");
      }
    }

    // Validate spellcasting
    if (data.spellcasting) {
      if (data.spellcasting.saveDC < 8 || data.spellcasting.saveDC > 20) {
        throw new BadRequestException("Spell save DC must be between 8 and 20");
      }
      if (
        data.spellcasting.attackBonus < -5 ||
        data.spellcasting.attackBonus > 10
      ) {
        throw new BadRequestException(
          "Spell attack bonus must be between -5 and 10",
        );
      }
    }

    // Validate skill proficiencies (must have all 18 skills)
    if (data.skillProficiencies && data.skillProficiencies.length !== 18) {
      throw new BadRequestException(
        "Must provide proficiency data for all 18 skills",
      );
    }
  }

  /**
   * Create a new character
   */
  async create(
    createDto: CreateCharacterDto,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    this.validateDnDRules(createDto);

    // Check if user exists (for player characters)
    if (createDto.ownerId) {
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.ownerId },
      });
      if (!user) {
        throw new NotFoundException("User not found");
      }
    }

    // Check if campaign exists
    if (createDto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: createDto.campaignId },
      });
      if (!campaign) {
        throw new NotFoundException("Campaign not found");
      }
    }

    // Create character with nested relations
    const character = await this.prisma.character.create({
      data: {
        name: createDto.name,
        race: createDto.race,
        subrace: createDto.subrace,
        multiclasses: createDto.multiclasses
          ? {
              create: createDto.multiclasses.map((mc) => ({
                class: mc.class,
                level: mc.level,
              })),
            }
          : undefined,
        level: createDto.level,
        background: createDto.background,
        alignment: createDto.alignment,
        experiencePoints: createDto.experiencePoints,
        inspiration: createDto.inspiration,
        abilityScores: {
          create: createDto.abilityScores,
        },
        skillProficiencies: {
          create: createDto.skillProficiencies,
        },
        savingThrows: createDto.savingThrows,
        proficiencyBonus: this.calculateProficiencyBonus(createDto.level),
        hitPoints: createDto.hitPoints as any,
        armorClass: createDto.armorClass,
        initiative: createDto.initiative,
        speed: createDto.speed,
        spellcasting: createDto.spellcasting as any,
        featuresTraits: createDto.featuresTraits,
        personalityTraits: createDto.personalityTraits,
        ideals: createDto.ideals,
        bonds: createDto.bonds,
        flaws: createDto.flaws,
        appearance: createDto.appearance as any,
        backstory: createDto.backstory,
        languages: createDto.languages,
        currency: createDto.currency as any,
        ownerId: createDto.ownerId,
        campaignId: createDto.campaignId,
        knownSpells: createDto.spellcasting?.knownSpells || [],
        preparedSpells: createDto.spellcasting?.preparedSpells || [],
      } as any,
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(character);
  }

  /**
   * Find all characters for a user
   */
  async findAll(userId: string): Promise<CharacterResponseDto[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { campaignId: { not: null } }, // NPCs in campaigns
        ],
      },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return characters.map((character) => this.mapToResponseDto(character));
  }

  /**
   * Find a character by ID
   */
  async findOne(id: string, userId?: string): Promise<CharacterResponseDto> {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    // Check ownership/access permissions
    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    return this.mapToResponseDto(character);
  }

  /**
   * Update a character
   */
  async update(
    id: string,
    updateDto: UpdateCharacterDto,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    this.validateDnDRules(updateDto);

    // Check if character exists and user has access
    const existingCharacter = await this.prisma.character.findUnique({
      where: { id },
      include: {
        abilityScores: true,
        skillProficiencies: true,
      },
    });

    if (!existingCharacter) {
      throw new NotFoundException("Character not found");
    }

    if (existingCharacter.ownerId && existingCharacter.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Prepare update data
    const updateData: any = {};

    // Handle simple field updates
    const simpleFields = [
      "name",
      "subrace",
      "level",
      "background",
      "alignment",
      "experiencePoints",
      "inspiration",
      "savingThrows",
      "hitDice",
      "armorClass",
      "initiative",
      "speed",
      "featuresTraits",
      "personalityTraits",
      "ideals",
      "bonds",
      "flaws",
      "backstory",
      "languages",
      "campaignId",
      "knownSpells",
      "preparedSpells",
    ];

    simpleFields.forEach((field) => {
      if (updateDto[field as keyof UpdateCharacterDto] !== undefined) {
        updateData[field] = updateDto[field as keyof UpdateCharacterDto];
      }
    });

    // Update proficiency bonus if level changed
    if (updateDto.level !== undefined) {
      updateData.proficiencyBonus = this.calculateProficiencyBonus(
        updateDto.level,
      );
    }

    // Handle nested object updates
    if (updateDto.abilityScores) {
      updateData.abilityScores = {
        update: updateDto.abilityScores,
      };
    }

    if (updateDto.hitPoints) {
      updateData.hitPoints = updateDto.hitPoints;
    }

    if (updateDto.spellcasting !== undefined) {
      updateData.spellcasting = updateDto.spellcasting;
    }

    if (updateDto.appearance !== undefined) {
      updateData.appearance = updateDto.appearance;
    }

    if (updateDto.currency) {
      updateData.currency = updateDto.currency;
    }

    // Handle skill proficiencies update
    if (updateDto.skillProficiencies) {
      updateData.skillProficiencies = {
        deleteMany: {},
        create: updateDto.skillProficiencies,
      };
    }

    // Handle multiclasses update
    if (updateDto.multiclasses !== undefined) {
      updateData.multiclasses = {
        deleteMany: {},
        create: updateDto.multiclasses.map((mc) => ({
          class: mc.class,
          level: mc.level,
        })),
      };
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    // Publish events for changes
    await this.publishEvents(existingCharacter, updatedCharacter, updateDto);

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Delete a character
   */
  async remove(id: string, userId?: string): Promise<void> {
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    await this.prisma.character.delete({
      where: { id },
    });
  }

  /**
   * Add a spell to character's known spells
   */
  async addKnownSpell(
    characterId: string,
    spellId: string,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Check if spell exists
    const spell = await this.prisma.spell.findUnique({
      where: { id: spellId },
    });

    if (!spell) {
      throw new NotFoundException("Spell not found");
    }

    // Add spell to known spells if not already known
    const knownSpells = character.knownSpells || [];
    if (!knownSpells.includes(spellId)) {
      knownSpells.push(spellId);
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { knownSpells },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Remove a spell from character's known spells
   */
  async removeKnownSpell(
    characterId: string,
    spellId: string,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Remove spell from known spells
    const knownSpells = (character.knownSpells || []).filter(
      (id) => id !== spellId,
    );

    // Also remove from prepared spells if it was prepared
    const preparedSpells = (character.preparedSpells || []).filter(
      (id) => id !== spellId,
    );

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { knownSpells, preparedSpells },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Add a spell to character's prepared spells
   */
  async addPreparedSpell(
    characterId: string,
    spellId: string,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Check if spell is known
    const knownSpells = character.knownSpells || [];
    if (!knownSpells.includes(spellId)) {
      throw new BadRequestException("Cannot prepare a spell that is not known");
    }

    // Add spell to prepared spells if not already prepared
    const preparedSpells = character.preparedSpells || [];
    if (!preparedSpells.includes(spellId)) {
      preparedSpells.push(spellId);
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { preparedSpells },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Remove a spell from character's prepared spells
   */
  async removePreparedSpell(
    characterId: string,
    spellId: string,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Remove spell from prepared spells
    const preparedSpells = (character.preparedSpells || []).filter(
      (id) => id !== spellId,
    );

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { preparedSpells },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Update character's spell slots
   */
  async updateSpellSlots(
    characterId: string,
    remainingSlots: Record<string, number>,
    userId?: string,
  ): Promise<CharacterResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Validate remaining slots
    for (const [level, count] of Object.entries(remainingSlots)) {
      if (count < 0) {
        throw new BadRequestException(
          `Remaining slots for level ${level} cannot be negative`,
        );
      }
    }

    // Update spellcasting data
    const spellcasting = character.spellcasting as any;
    if (spellcasting) {
      spellcasting.remainingSlots = remainingSlots;
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: { spellcasting },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    return this.mapToResponseDto(updatedCharacter);
  }

  /**
   * Publish events based on character changes
   */
  private async publishEvents(
    existingCharacter: any,
    updatedCharacter: any,
    updateDto: UpdateCharacterDto,
  ): Promise<void> {
    // Check for HP changes
    if (updateDto.hitPoints) {
      const oldHP = existingCharacter.hitPoints?.current || 0;
      const newHP = updateDto.hitPoints.current;

      if (newHP < oldHP) {
        // Damage applied
        const damage = oldHP - newHP;
        const damageEvent: DamageAppliedEvent = {
          type: EventType.DAMAGE_APPLIED,
          targetId: updatedCharacter.id,
          payload: {
            damage,
            damageType: "unknown", // Could be enhanced to track damage types
          },
          sessionId: updatedCharacter.campaignId, // Use campaign as session for now
        };
        await this.eventBus.publish(damageEvent);
      } else if (newHP > oldHP) {
        // Healing received
        const healing = newHP - oldHP;
        const healingEvent: HealingReceivedEvent = {
          type: EventType.HEALING_RECEIVED,
          targetId: updatedCharacter.id,
          payload: {
            healing,
          },
          sessionId: updatedCharacter.campaignId,
        };
        await this.eventBus.publish(healingEvent);
      }

      // Check for death
      if (newHP <= 0 && oldHP > 0) {
        const deathEvent: DeathEvent = {
          type: EventType.DEATH,
          targetId: updatedCharacter.id,
          payload: {
            cause: "damage",
          },
          sessionId: updatedCharacter.campaignId,
        };
        await this.eventBus.publish(deathEvent);
      }
    }

    // Check for level up
    if (updateDto.level && updateDto.level > existingCharacter.level) {
      const levelUpEvent: LevelUpEvent = {
        type: EventType.LEVEL_UP,
        targetId: updatedCharacter.id,
        payload: {
          newLevel: updateDto.level,
          oldLevel: existingCharacter.level,
        },
        sessionId: updatedCharacter.campaignId,
      };
      await this.eventBus.publish(levelUpEvent);
    }
  }

  /**
   * Map Prisma character to response DTO
   */
  private mapToResponseDto(character: any): CharacterResponseDto {
    return {
      id: character.id,
      name: character.name,
      race: character.race,
      subrace: character.subrace,
      multiclasses: character.multiclasses || [],
      level: character.level,
      background: character.background,
      alignment: character.alignment,
      experiencePoints: character.experiencePoints,
      inspiration: character.inspiration,
      abilityScores: character.abilityScores,
      skillProficiencies: character.skillProficiencies || [],
      savingThrows: character.savingThrows,
      proficiencyBonus: character.proficiencyBonus,
      hitDice: character.hitDice,
      hitPoints: character.hitPoints,
      armorClass: character.armorClass,
      initiative: character.initiative,
      speed: character.speed,
      spellcasting: character.spellcasting,
      featuresTraits: character.featuresTraits,
      personalityTraits: character.personalityTraits,
      ideals: character.ideals,
      bonds: character.bonds,
      flaws: character.flaws,
      appearance: character.appearance,
      backstory: character.backstory,
      languages: character.languages,
      currency: character.currency,
      ownerId: character.ownerId,
      campaignId: character.campaignId,
      isNPC: character.isNPC,
      npcRole: character.npcRole,
      challengeRating: character.challengeRating,
      lootTable: character.lootTable,
      knownSpells: character.knownSpells,
      preparedSpells: character.preparedSpells,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
  }
}
