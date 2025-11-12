# Database Schema

This document describes the PostgreSQL database schema used by the D&D Companion application.

## Overview

The database uses Prisma ORM with PostgreSQL and follows Domain-Driven Design principles. The schema is organized around bounded contexts with clear relationships between entities.

## Core Tables

### User

Stores user account information and authentication data.

```sql
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "username" TEXT UNIQUE,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "roles" "Role"[] DEFAULT '{PLAYER}',
  "subscriptionTier" "SubscriptionTier" DEFAULT 'FREE',
  "profile" JSONB,
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**

- One-to-many with `Character` (as owner)
- One-to-many with `Campaign` (as DM)
- Many-to-many with `Campaign` (as player)

### Character

Represents both player characters (PCs) and non-player characters (NPCs).

```sql
CREATE TABLE "Character" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "race" "Race" NOT NULL,
  "subrace" TEXT,
  "level" INTEGER DEFAULT 1,
  "background" TEXT,
  "alignment" "Alignment",
  "experiencePoints" INTEGER DEFAULT 0,
  "inspiration" BOOLEAN DEFAULT false,
  "proficiencyBonus" INTEGER DEFAULT 2,
  "hitDice" TEXT,
  "hitPoints" JSONB NOT NULL,
  "armorClass" INTEGER DEFAULT 10,
  "initiative" INTEGER DEFAULT 0,
  "speed" INTEGER DEFAULT 30,
  "spellcasting" JSONB,
  "featuresTraits" TEXT[],
  "personalityTraits" TEXT,
  "ideals" TEXT,
  "bonds" TEXT,
  "flaws" TEXT,
  "appearance" JSONB,
  "backstory" TEXT,
  "languages" TEXT[],
  "currency" JSONB NOT NULL,
  "ownerId" UUID,
  "campaignId" UUID,
  "isNPC" BOOLEAN DEFAULT false,
  "npcRole" "NPCRole",
  "challengeRating" FLOAT,
  "lootTable" JSONB,
  "knownSpells" TEXT[],
  "preparedSpells" TEXT[],
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**

- Many-to-one with `User` (owner)
- Many-to-one with `Campaign` (active campaign)
- One-to-one with `AbilityScores`
- One-to-many with `SkillProficiency`
- One-to-many with `Multiclass`
- Many-to-many with `Feature`
- Many-to-many with `Quest` (through `CharacterQuest`)

### AbilityScores

Embedded ability scores for characters.

```sql
CREATE TABLE "AbilityScores" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID UNIQUE NOT NULL,
  "strength" INTEGER NOT NULL,
  "dexterity" INTEGER NOT NULL,
  "constitution" INTEGER NOT NULL,
  "intelligence" INTEGER NOT NULL,
  "wisdom" INTEGER NOT NULL,
  "charisma" INTEGER NOT NULL
);
```

### SkillProficiency

Character skill proficiencies and expertise.

```sql
CREATE TABLE "SkillProficiency" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL,
  "skill" "SkillName" NOT NULL,
  "proficient" BOOLEAN DEFAULT false,
  "expertise" BOOLEAN DEFAULT false
);
```

### Multiclass

Multiclass information for characters.

```sql
CREATE TABLE "Multiclass" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL,
  "class" "CharacterClass" NOT NULL,
  "level" INTEGER NOT NULL
);
```

### Campaign

Represents a D&D campaign with quests, sessions, and participants.

```sql
CREATE TABLE "Campaign" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "dmId" UUID NOT NULL,
  "playerIds" UUID[],
  "questIds" UUID[],
  "npcIds" UUID[],
  "locationIds" UUID[],
  "activePlayers" UUID[],
  "currentSessionId" UUID,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Quest

Represents quests, missions, and objectives within campaigns.

```sql
CREATE TABLE "Quest" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "campaignId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "summary" TEXT,
  "description" TEXT,
  "status" "QuestStatus" DEFAULT 'NOT_STARTED',
  "experienceReward" INTEGER DEFAULT 0,
  "loot" JSONB,
  "npcIds" TEXT[],
  "locationIds" TEXT[],
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### CharacterQuest

Junction table for character-quest relationships.

```sql
CREATE TABLE "CharacterQuest" (
  "characterId" UUID NOT NULL,
  "questId" UUID NOT NULL,
  "status" "QuestStatus" DEFAULT 'IN_PROGRESS',
  "rewardClaimed" BOOLEAN DEFAULT false,
  PRIMARY KEY ("characterId", "questId")
);
```

### Session

Represents individual game sessions within campaigns.

```sql
CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "campaignId" UUID NOT NULL,
  "date" TIMESTAMP DEFAULT NOW(),
  "notes" TEXT,
  "events" JSONB,
  "playerCharacterIds" TEXT[],
  "currentCampaignId" UUID UNIQUE
);
```

### GameEvent

Records events that occur during gameplay for audit and replay purposes.

```sql
CREATE TABLE "GameEvent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" "EventType" NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "actorId" UUID,
  "targetId" UUID,
  "payload" JSONB,
  "sessionId" UUID NOT NULL
);
```

### Inventory

Manages character and session inventories.

```sql
CREATE TABLE "Inventory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ownerType" "OwnerType" NOT NULL,
  "ownerId" UUID NOT NULL,
  "items" JSONB,
  "encumbrance" JSONB
);
```

### InventoryItem

Individual items within inventories.

```sql
CREATE TABLE "InventoryItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "inventoryId" UUID NOT NULL,
  "itemId" UUID NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "equipped" BOOLEAN DEFAULT false,
  "notes" TEXT
);
```

### Item

Master catalog of all items (weapons, armor, consumables, etc.).

```sql
CREATE TABLE "Item" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "type" "ItemType" NOT NULL,
  "rarity" "Rarity" DEFAULT 'COMMON',
  "weight" FLOAT DEFAULT 0,
  "properties" JSONB,
  "effects" JSONB,
  "source" TEXT,
  "description" TEXT
);
```

### Spell

Master catalog of all spells.

```sql
CREATE TABLE "Spell" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "level" INTEGER DEFAULT 0,
  "school" "SpellSchool",
  "castingTime" TEXT,
  "range" TEXT,
  "components" JSONB,
  "duration" JSONB NOT NULL,
  "classes" TEXT[],
  "description" TEXT,
  "higherLevel" TEXT
);
```

### Feature

Character features, traits, and abilities.

```sql
CREATE TABLE "Feature" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "level" INTEGER
);
```

### Location

Geographic locations within campaigns.

```sql
CREATE TABLE "Location" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "type" "LocationType" NOT NULL,
  "description" TEXT,
  "mapUrl" TEXT,
  "parentId" UUID,
  "children" JSONB,
  "npcs" JSONB,
  "quests" JSONB,
  "campaigns" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### GeneratorRequest

Tracks content generation requests.

```sql
CREATE TABLE "GeneratorRequest" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" "GeneratorType" NOT NULL,
  "tags" TEXT[],
  "prompt" TEXT,
  "status" "GeneratorStatus" DEFAULT 'PENDING',
  "resultId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### GeneratedEntity

Stores results of content generation.

```sql
CREATE TABLE "GeneratedEntity" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "entityType" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### DMNote

Free-form notes created by Dungeon Masters.

```sql
CREATE TABLE "DMNote" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "content" TEXT NOT NULL,
  "links" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Link

Relationships between entities in DM notes.

```sql
CREATE TABLE "Link" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "noteId" UUID NOT NULL,
  "relatedEntityType" TEXT NOT NULL,
  "relatedEntityId" UUID NOT NULL,
  "relationship" TEXT NOT NULL
);
```

## Enums

```sql
-- User roles
CREATE TYPE "Role" AS ENUM ('PLAYER', 'DM', 'ADMIN');

-- Character races
CREATE TYPE "Race" AS ENUM ('HUMAN', 'ELF', 'DWARF', 'HALFLING', 'DRAGONBORN', 'GNOME', 'HALF_ELF', 'HALF_ORC', 'TIEFLING', 'AASIMAR', 'GENASI', 'TABAXI', 'TORTLE');

-- Character classes
CREATE TYPE "CharacterClass" AS ENUM ('BARBARIAN', 'BARD', 'CLERIC', 'DRUID', 'FIGHTER', 'MONK', 'PALADIN', 'RANGER', 'ROGUE', 'SORCERER', 'WARLOCK', 'WIZARD', 'ARTIFICER');

-- Ability names
CREATE TYPE "AbilityName" AS ENUM ('STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA');

-- Skill names
CREATE TYPE "SkillName" AS ENUM ('ACROBATICS', 'ANIMAL_HANDLING', 'ARCANA', 'ATHLETICS', 'DECEPTION', 'HISTORY', 'INSIGHT', 'INTIMIDATION', 'INVESTIGATION', 'MEDICINE', 'NATURE', 'PERCEPTION', 'PERFORMANCE', 'PERSUASION', 'RELIGION', 'SLEIGHT_OF_HAND', 'STEALTH', 'SURVIVAL');

-- Character alignment
CREATE TYPE "Alignment" AS ENUM ('LAWFUL_GOOD', 'NEUTRAL_GOOD', 'CHAOTIC_GOOD', 'LAWFUL_NEUTRAL', 'TRUE_NEUTRAL', 'CHAOTIC_NEUTRAL', 'LAWFUL_EVIL', 'NEUTRAL_EVIL', 'CHAOTIC_EVIL');

-- Item types and rarities
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'TOOL', 'CONSUMABLE', 'MAGIC_ITEM', 'LOOT');
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY');

-- Spell schools
CREATE TYPE "SpellSchool" AS ENUM ('ABJURATION', 'CONJURATION', 'DIVINATION', 'ENCHANTMENT', 'EVOCATION', 'ILLUSION', 'NECROMANCY', 'TRANSMUTATION');

-- Location types
CREATE TYPE "LocationType" AS ENUM ('CITY', 'DUNGEON', 'WILDERNESS', 'TOWN', 'VILLAGE', 'CASTLE', 'TEMPLE', 'SHOP');

-- Generator types and statuses
CREATE TYPE "GeneratorType" AS ENUM ('NPC', 'LOCATION', 'CAMPAIGN', 'ITEM', 'SPELL');
CREATE TYPE "GeneratorStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Event types
CREATE TYPE "EventType" AS ENUM ('DAMAGE_APPLIED', 'HEALING_RECEIVED', 'ITEM_GIVEN', 'SPELL_CAST', 'QUEST_UPDATED', 'LEVEL_UP', 'DEATH');

-- Quest statuses
CREATE TYPE "QuestStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Subscription tiers
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

-- Owner types for inventory
CREATE TYPE "OwnerType" AS ENUM ('CHARACTER', 'SESSION');

-- NPC roles
CREATE TYPE "NPCRole" AS ENUM ('MERCHANT', 'ALLY', 'ENEMY', 'QUEST_GIVER', 'VILLAIN');
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "Character_ownerId_idx" ON "Character"("ownerId");
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");
CREATE INDEX "Campaign_dmId_idx" ON "Campaign"("dmId");
CREATE INDEX "Quest_campaignId_idx" ON "Quest"("campaignId");
CREATE INDEX "Session_campaignId_idx" ON "Session"("campaignId");
CREATE INDEX "GameEvent_sessionId_idx" ON "GameEvent"("sessionId");
CREATE INDEX "GameEvent_timestamp_idx" ON "GameEvent"("timestamp");
CREATE INDEX "InventoryItem_inventoryId_idx" ON "InventoryItem"("inventoryId");
CREATE INDEX "Item_type_idx" ON "Item"("type");
CREATE INDEX "Item_rarity_idx" ON "Item"("rarity");
CREATE INDEX "Spell_level_idx" ON "Spell"("level");
CREATE INDEX "Spell_school_idx" ON "Spell"("school");

-- Unique constraints
ALTER TABLE "AbilityScores" ADD CONSTRAINT "AbilityScores_characterId_key" UNIQUE ("characterId");
ALTER TABLE "SkillProficiency" ADD CONSTRAINT "SkillProficiency_characterId_skill_key" UNIQUE ("characterId", "skill");
ALTER TABLE "Multiclass" ADD CONSTRAINT "Multiclass_characterId_class_key" UNIQUE ("characterId", "class");
```

## Foreign Key Constraints

```sql
-- Character relationships
ALTER TABLE "Character" ADD CONSTRAINT "Character_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL;

-- Ability scores
ALTER TABLE "AbilityScores" ADD CONSTRAINT "AbilityScores_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE;

-- Skill proficiencies
ALTER TABLE "SkillProficiency" ADD CONSTRAINT "SkillProficiency_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE;

-- Multiclass entries
ALTER TABLE "Multiclass" ADD CONSTRAINT "Multiclass_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE;

-- Campaign relationships
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_currentSessionId_fkey" FOREIGN KEY ("currentSessionId") REFERENCES "Session"("id") ON DELETE SET NULL;

-- Quest relationships
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE;

-- Character-quest relationships
ALTER TABLE "CharacterQuest" ADD CONSTRAINT "CharacterQuest_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE;
ALTER TABLE "CharacterQuest" ADD CONSTRAINT "CharacterQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE;

-- Session relationships
ALTER TABLE "Session" ADD CONSTRAINT "Session_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_currentCampaignId_fkey" FOREIGN KEY ("currentCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL;

-- Game events
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Character"("id") ON DELETE SET NULL;
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Character"("id") ON DELETE SET NULL;
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE;

-- Inventory relationships
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE;

-- Location hierarchy
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL;

-- DM note links
ALTER TABLE "Link" ADD CONSTRAINT "Link_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "DMNote"("id") ON DELETE CASCADE;
```

## Data Migration Strategy

When deploying schema changes:

1. Create a new migration file using `npx prisma migrate dev --create-only`
2. Review and test the migration on a development database
3. Apply the migration to staging environment
4. Monitor for any performance impacts
5. Apply to production during maintenance window

## Backup Strategy

- Daily automated backups of production database
- Point-in-time recovery capability (7-day retention)
- Encrypted backups stored in cloud storage
- Regular backup restoration testing

## Performance Considerations

- Use UUIDs for primary keys to avoid hotspots
- Implement proper indexing for frequently queried columns
- Use JSONB for flexible data structures (spellcasting, inventory, etc.)
- Consider partitioning for large tables (GameEvent, audit logs)
- Monitor query performance and adjust indexes as needed
