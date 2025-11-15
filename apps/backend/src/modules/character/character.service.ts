import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import { InventoryService } from "../inventory/inventory.service";
import {
  EventType,
  DamageAppliedEvent,
  HealingReceivedEvent,
  LevelUpEvent,
  DeathEvent,
  ExperienceGainedEvent,
} from "../events/dto";
import {
  CreateCharacterDto,
  UpdateCharacterDto,
  CharacterResponseDto,
  SkillName,
  AbilityName,
  MulticlassDto,
} from "./dto";
import {
  calculateProficiencyBonus,
  calculateAbilityModifier,
  HIT_DICE,
  SPELLCASTING_CLASSES,
  SPELLCASTING_ABILITY,
  getSpellSlots,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
} from "../../common/constants";

@Injectable()
export class CharacterService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private inventoryService: InventoryService,
  ) {}

  /**
   * Initialize spellcasting data for a character
   */
  private initializeSpellcasting(
    characterClass: string,
    level: number,
    abilityScores: any,
  ): any {
    const spellcastingAbility =
      SPELLCASTING_ABILITY[characterClass] || "INTELLIGENCE";
    const abilityModifier = calculateAbilityModifier(
      abilityScores[spellcastingAbility.toLowerCase()],
    );

    const spellSlots = getSpellSlots(characterClass, level);
    const proficiencyBonus = calculateProficiencyBonus(level);

    return {
      class: characterClass,
      saveDC: calculateSpellSaveDC(abilityModifier, proficiencyBonus),
      attackBonus: calculateSpellAttackBonus(abilityModifier, proficiencyBonus),
      knownSpells: [],
      preparedSpells: [],
      slots: spellSlots,
    };
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
    userId: string,
  ): Promise<CharacterResponseDto> {
    this.validateDnDRules(createDto);

    // Check if campaign exists
    if (createDto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: createDto.campaignId },
      });
      if (!campaign) {
        throw new NotFoundException("Campaign not found");
      }
    }

    // Handle class data - transform single class to multiclasses if needed
    let multiclassesData = createDto.multiclasses;
    if (!multiclassesData && createDto.class) {
      multiclassesData = [{ class: createDto.class, level: createDto.level }];
    }

    // Validate multiclass levels and combinations if provided
    if (multiclassesData) {
      const totalLevel = multiclassesData.reduce(
        (sum, mc) => sum + mc.level,
        0,
      );
      if (totalLevel !== createDto.level) {
        throw new BadRequestException(
          `Total multiclass levels (${totalLevel}) must equal character level (${createDto.level})`,
        );
      }

      // Validate multiclass combinations (basic restrictions)
      this.validateMulticlassCombination(multiclassesData);
    }

    // Calculate hit points based on class hit dice if not provided
    let hitPointsData = createDto.hitPoints;
    if (!hitPointsData && multiclassesData && multiclassesData.length > 0) {
      const conModifier = calculateAbilityModifier(
        createDto.abilityScores.constitution,
      );

      let totalHP = 0;
      for (const mc of multiclassesData) {
        const hitDie = HIT_DICE[mc.class] || 8;
        // First level gets full hit die + con modifier
        // Subsequent levels get average (floor(hitDie/2)+1) + con modifier
        const firstLevelHP = hitDie + conModifier;
        const additionalLevelsHP =
          (mc.level - 1) * (Math.floor(hitDie / 2) + 1 + conModifier);
        totalHP += firstLevelHP + additionalLevelsHP;
      }

      hitPointsData = {
        max: Math.max(totalHP, 1), // Ensure at least 1 HP
        current: Math.max(totalHP, 1),
        temporary: 0,
      };
    }

    // Initialize spellcasting data if character has spellcasting class
    let spellcastingData = createDto.spellcasting;
    if (!spellcastingData && multiclassesData) {
      const spellcastingClass = multiclassesData.find((mc) =>
        SPELLCASTING_CLASSES.includes(mc.class),
      );
      if (spellcastingClass) {
        spellcastingData = this.initializeSpellcasting(
          spellcastingClass.class,
          spellcastingClass.level,
          createDto.abilityScores,
        );
      }
    }

    // Create character with nested relations
    const character = await this.prisma.character.create({
      data: {
        name: createDto.name,
        race: createDto.race,
        subrace: createDto.subrace,
        multiclasses: multiclassesData
          ? {
              create: multiclassesData.map((mc) => ({
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
        proficiencyBonus: calculateProficiencyBonus(createDto.level),
        hitPoints: hitPointsData as any,
        armorClass: createDto.armorClass,
        initiative: createDto.initiative,
        speed: createDto.speed,
        spellcasting: spellcastingData as any,
        featuresTraits: createDto.featuresTraits,
        personalityTraits: createDto.personalityTraits,
        ideals: createDto.ideals,
        bonds: createDto.bonds,
        flaws: createDto.flaws,
        appearance: createDto.appearance as any,
        backstory: createDto.backstory,
        languages: createDto.languages,
        currency: createDto.currency as any,
        ownerId: createDto.isNPC ? null : userId,
        creatorId: createDto.isNPC ? userId : null,
        visibility: createDto.isNPC ? "PUBLIC" : null,
        campaignId: createDto.campaignId,
        isNPC: createDto.isNPC || false,
        knownSpells: spellcastingData?.knownSpells || [],
        preparedSpells: spellcastingData?.preparedSpells || [],
      } as any,
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });

    // Create inventory for the character
    console.log(`Creating inventory for character ${character.id}`);
    await this.inventoryService.createCharacterInventory(character.id);
    console.log(`Successfully created inventory for character ${character.id}`);

    // Add starting equipment based on class and background
    if (multiclassesData && multiclassesData.length > 0) {
      const primaryClass = multiclassesData[0].class;
      const startingEquipment = this.getStartingEquipment(
        primaryClass,
        createDto.background,
      );
      for (const itemName of startingEquipment) {
        try {
          // Try to find the item by name and add it to inventory
          const item = await this.prisma.item.findFirst({
            where: { name: { equals: itemName, mode: "insensitive" } },
          });
          if (item) {
            const addItemDto = { itemId: item.id, quantity: 1 };
            await this.inventoryService.addItem(character.id, addItemDto);
          }
        } catch (error) {
          console.warn(
            `Could not add starting equipment item: ${itemName}`,
            error,
          );
        }
      }
    }

    return this.mapToResponseDto(character);
  }

  /**
   * Find all characters for a user
   */
  async findAll(userId: string): Promise<CharacterResponseDto[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        OR: [
          { ownerId: userId }, // Player characters owned by user
          {
            AND: [
              { isNPC: true },
              {
                OR: [{ visibility: "PUBLIC" }, { creatorId: userId }],
              },
            ],
          }, // NPCs that are public or created by user
        ],
        NOT: { isDemo: true }, // Filter out demo characters (exclude isDemo: true, include false and null)
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
   * Find all demo characters
   */
  async findDemoCharacters(): Promise<CharacterResponseDto[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        isDemo: true,
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
    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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

    const char = existingCharacter as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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
      updateData.proficiencyBonus = calculateProficiencyBonus(updateDto.level);
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

    // Handle class and multiclasses update
    if (updateDto.class !== undefined || updateDto.multiclasses !== undefined) {
      let multiclassesData = updateDto.multiclasses;
      if (!multiclassesData && updateDto.class) {
        multiclassesData = [
          {
            class: updateDto.class,
            level: updateDto.level || existingCharacter.level,
          },
        ];
      }

      // Validate multiclass levels if provided
      if (multiclassesData) {
        const totalLevel = multiclassesData.reduce(
          (sum, mc) => sum + mc.level,
          0,
        );
        const targetLevel = updateDto.level || existingCharacter.level;
        if (totalLevel !== targetLevel) {
          throw new BadRequestException(
            `Total multiclass levels (${totalLevel}) must equal character level (${targetLevel})`,
          );
        }
      }

      updateData.multiclasses = {
        deleteMany: {},
        create:
          multiclassesData?.map((mc) => ({
            class: mc.class,
            level: mc.level,
          })) || [],
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
    await this.publishEvents(
      existingCharacter,
      updatedCharacter,
      updateDto,
      userId,
    );

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

    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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

    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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

    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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

    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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

    const char = character as any;
    if (char.isNPC) {
      if (char.visibility !== "PUBLIC" && char.creatorId !== userId) {
        throw new ForbiddenException("You don't have access to this NPC");
      }
    } else {
      if (char.ownerId && char.ownerId !== userId) {
        throw new ForbiddenException("You don't have access to this character");
      }
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
    userId?: string,
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
          ...(userId && { actorId: userId }),
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
          ...(userId && { actorId: userId }),
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
          ...(userId && { actorId: userId }),
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
        ...(userId && { actorId: userId }),
      };
      await this.eventBus.publish(levelUpEvent);
    }

    // Check for experience gained
    if (
      updateDto.experiencePoints !== undefined &&
      updateDto.experiencePoints > existingCharacter.experiencePoints
    ) {
      const experienceGained =
        updateDto.experiencePoints - existingCharacter.experiencePoints;
      const experienceEvent: ExperienceGainedEvent = {
        type: EventType.EXPERIENCE_GAINED,
        targetId: updatedCharacter.id,
        payload: {
          experienceGained,
          totalExperience: updateDto.experiencePoints,
        },
        sessionId: updatedCharacter.campaignId,
        ...(userId && { actorId: userId }),
      };
      await this.eventBus.publish(experienceEvent);
    }
  }

  /**
   * Get starting equipment for a class
   */
  private getStartingEquipment(
    characterClass: string,
    background?: string,
  ): string[] {
    const equipment: Record<string, string[]> = {
      FIGHTER: [
        "chain-mail",
        "longsword",
        "shield",
        "light-crossbow",
        "20-arrows",
        "explorer-pack",
        "dungeoneer-pack",
      ],
      WIZARD: ["spellbook", "arcane-focus", "scholar-pack", "dagger"],
      ROGUE: [
        "rapier",
        "shortbow",
        "20-arrows",
        "leather-armor",
        "thieves-tools",
        "burglar-pack",
      ],
      // Add more classes as needed
    };

    const classEquipment = equipment[characterClass] || [];
    const backgroundEquipment = this.getBackgroundEquipment(background);

    return [...classEquipment, ...backgroundEquipment];
  }

  /**
   * Get background equipment
   */
  private getBackgroundEquipment(background?: string): string[] {
    const equipment: Record<string, string[]> = {
      noble: ["fine-clothes", "signet-ring", "scroll-case", "25-gp"],
      soldier: ["rank-insignia", "hunting-trap", "bone-dice", "10-gp"],
      criminal: ["crowbar", "dark-clothes", "15-gp"],
      // Add more backgrounds as needed
    };

    return equipment[background || ""] || [];
  }

  /**
   * Validate multiclass combinations
   */
  private validateMulticlassCombination(multiclasses: MulticlassDto[]): void {
    const classes = multiclasses.map((mc) => mc.class);

    // Check for duplicate classes
    const uniqueClasses = new Set(classes);
    if (uniqueClasses.size !== classes.length) {
      throw new BadRequestException(
        "Cannot have duplicate classes in multiclassing",
      );
    }

    // Basic multiclass restrictions (simplified)
    const restrictedCombinations: string[][] = [
      // Add specific restrictions as needed, e.g., ['BARBARIAN', 'MONK']
    ];

    for (const restriction of restrictedCombinations) {
      const hasAllRestricted = restriction.every((cls: string) =>
        classes.includes(cls as any),
      );
      if (hasAllRestricted) {
        throw new BadRequestException(
          `Invalid multiclass combination: ${restriction.join(
            " + ",
          )} is not allowed`,
        );
      }
    }

    // Ensure at least one class has level 1 or higher
    const hasValidLevel = multiclasses.some((mc) => mc.level >= 1);
    if (!hasValidLevel) {
      throw new BadRequestException(
        "At least one class must have level 1 or higher",
      );
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
      avatarUrl: character.avatarUrl,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
  }
}
