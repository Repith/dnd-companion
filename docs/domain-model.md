# Domain Model

This document proposes the initial domain model for the DnD Companion.  Entities are grouped by bounded contexts defined in the architecture.  Attributes are based on the official DnD 5e character sheet【610953689760937†L0-L23】【610953689760937†L33-L67】, extended to support digital gameplay, inventory and campaign management.

## User and Access Context

### User

Represents an authenticated person who can act as a player, DM, or both.

* **id** – unique identifier (UUID).
* **username** / **email** – login credentials.
* **passwordHash** – securely stored password.
* **roles** – list of roles (e.g., `PLAYER`, `DM`, `ADMIN`).
* **subscriptionTier** – optional enumeration (FREE, PREMIUM, etc.) for future subscription features.
* **profile** – nested object with display name, avatar URL and locale.
* **createdAt**, **updatedAt**, **lastLogin**.

### Role

Defines permissions and feature flags.  For example, a DM can create campaigns while a player cannot.  Roles can be extended for future tiers.

## Character Context

### Character

Represents a player character (PC) or non‑player character (NPC).  Each character belongs to a user (player) or a campaign (NPC) and may appear in multiple sessions.

* **id** – UUID.
* **name** – character’s name.
* **race**, **subrace** – string values.
* **class** – main class (e.g., Fighter, Wizard) and optional multiclass array.
* **level** – integer; influences proficiency bonus and hit dice.
* **background** – descriptive text.
* **alignment** – lawful good, chaotic neutral, etc.
* **experiencePoints** – current XP【610953689760937†L0-L23】.
* **inspiration** – boolean flag.
* **stats** – embedded **AbilityScores**.
* **skills** – list of **SkillProficiency** objects.
* **savingThrows** – proficiency flags for each ability.
* **proficiencyBonus** – derived from level.
* **hitDice** – e.g., d10 per level; tracked as remaining/total【610953689760937†L81-L87】.
* **hitPoints** – max HP, current HP, temporary HP.
* **armorClass**, **initiative**, **speed** – numeric values.
* **spellcasting** – object containing spellcasting class, spell save DC, attack bonus, known spells, prepared spells, spell slots per level and remaining slots.
* **inventoryId** – references an **Inventory** document.
* **featuresTraits** – text list of racial/class features, feats and traits.
* **personalityTraits**, **ideals**, **bonds**, **flaws** – descriptive strings.
* **appearance** – includes age, height, weight, eyes, skin, hair.
* **backstory** – narrative description.
* **languages** – list of known languages.
* **currency** – copper, silver, electrum, gold, platinum pieces【610953689760937†L27-L32】.
* **ownerId** – user id for PC; null for campaign NPCs.
* **campaignId** – campaign where the character appears (for PCs, the active campaign).  NPCs may belong to multiple campaigns.
* **createdAt**, **updatedAt**.

### AbilityScores

Embedded document representing ability scores and modifiers.

* **strength**, **dexterity**, **constitution**, **intelligence**, **wisdom**, **charisma** – numeric values.
* **modifiers** – derived from scores (floor((score – 10)/2)).

### SkillProficiency

Represents a character’s proficiency in a skill.  DnD 5e defines 18 skills: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth and Survival【610953689760937†L33-L67】.

* **skill** – name of the skill.
* **proficient** – boolean indicating proficiency.
* **expertise** – boolean for expertise (double proficiency bonus).

## Inventory and Items Context

### Inventory

Represents a collection of items belonging to a character or session.  Modeled as a separate document to allow large collections and potential microservice isolation.

* **id** – UUID.
* **ownerType** – `CHARACTER` or `SESSION`.
* **ownerId** – references the character or session.
* **items** – array of **InventoryItem** entries.
* **encumbrance** – calculated total weight and capacity.

### InventoryItem

* **itemId** – references an **Item**.
* **quantity** – integer.
* **equipped** – boolean; indicates whether the item is equipped (affects AC, attacks, etc.).
* **notes** – free‑form text for customisation (e.g., weapon name, enchantment).

### Item

Represents an equipment piece, consumable or treasure.

* **id** – UUID.
* **name** – item name.
* **type** – `WEAPON`, `ARMOR`, `TOOL`, `CONSUMABLE`, `MAGIC_ITEM`, `LOOT`, etc.
* **rarity** – `COMMON`, `UNCOMMON`, `RARE`, `VERY_RARE`, `LEGENDARY`.
* **weight** – numeric weight.
* **properties** – object detailing damage dice, armor class bonus, required proficiency, attunement, charges, etc.
* **effects** – any modifiers to ability scores, skills, saving throws or other stats.
* **source** – book or homebrew reference.
* **description** – text.

## Spell and Ability Context

### Spell

Represents a spell from the SRD or homebrew.  Data can be imported from the 5e SRD API【480057457452803†L29-L41】.

* **id** – UUID or SRD index.
* **name**.
* **level** – 0 (cantrip) to 9.
* **school** – Abjuration, Conjuration, etc.
* **castingTime** – e.g., 1 action, 1 bonus action.
* **range** – numeric or special text.
* **components** – verbal, somatic, material.
* **duration** – duration and concentration flag.
* **classes** – list of class names that can learn the spell.
* **description** – full text of the spell effects.
* **higherLevel** – optional text describing upcasting effects.

### Feature / Trait / Ability

Represents class or racial features, feats, traits or backgrounds.  Each has a name, description, source and level requirement.

## Quest and Campaign Context

### Quest

Represents a task or mission with objectives, rewards and relationships to NPCs and locations.

* **id** – UUID.
* **campaignId** – associated campaign.
* **name** – quest name.
* **summary** – short description.
* **description** – detailed text with objectives, plot hooks and clues.
* **status** – `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`.
* **experienceReward** – amount of XP for completion.
* **loot** – list of item ids awarded upon completion.
* **npcIds** – characters involved (quest givers, villains, allies).
* **locationIds** – locations relevant to the quest.
* **notes** – DM or player notes.
* **createdAt**, **updatedAt**.

### Campaign

Container for quests, sessions, NPCs and general campaign metadata.

* **id** – UUID.
* **name** – campaign name.
* **description** – high‑level overview.
* **dmId** – user id of the Dungeon Master.
* **playerIds** – list of participating user ids.
* **questIds** – list of quests in this campaign.
* **npcIds**, **locationIds** – lists of NPCs and locations used in this campaign.
* **currentSessionId** – id of the active session.
* **createdAt**, **updatedAt**.

### Session

Represents a single game session within a campaign; stores logs and events.

* **id** – UUID.
* **campaignId** – associated campaign.
* **date** – session date/time.
* **notes** – session summary or DM notes.
* **events** – list of **GameEvent**.
* **inventoryId** – shared session inventory (e.g., communal loot or items on the ground).
* **playerCharacterIds** – list of character ids that participated.

### GameEvent

Represents an event that occurred during a session.  Events are also published on the event bus.

* **id** – UUID.
* **type** – e.g., `DAMAGE_APPLIED`, `HEALING_RECEIVED`, `ITEM_GIVEN`, `SPELL_CAST`, `QUEST_UPDATED`.
* **timestamp** – ISO timestamp.
* **actorId** – id of the character or user performing the action.
* **targetId** – id of the affected character, NPC or object.
* **payload** – JSON data describing the event specifics (amount of damage, item id, etc.).
* **sessionId** – session in which the event occurred.

## Generator Context

### GeneratorRequest

Represents a request to the generator service to produce content.

* **id** – UUID.
* **type** – `NPC`, `LOCATION`, `CAMPAIGN`, `ITEM`, `SPELL`.
* **tags** – list of tags (e.g., “medieval”, “undead”) used to guide AI prompts or filter JSON templates.
* **prompt** – optional free‑form prompt for AI generation.
* **status** – `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`.
* **resultId** – id of the generated entity (e.g., NPC id) once completed.

### GeneratedEntity

Generic wrapper to store the result of a generation request.  Could reference any of the domain entities (NPC, Item, Location, Spell, Quest, etc.).

* **id** – UUID.
* **entityType** – the type of generated entity.
* **data** – serialized entity data (JSON or document reference).
* **createdAt**.

## DM Zone and World‑Building Context

### Location

Represents a place within a world or campaign.

* **id** – UUID.
* **name**.
* **type** – `CITY`, `DUNGEON`, `WILDERNESS`, etc.
* **description** – narrative description.
* **mapUrl** – optional link to an uploaded map image.
* **parentId** – optional reference to a parent location (for hierarchical maps).
* **npcIds** – NPCs found here.
* **questIds** – quests associated with this location.

### NPC

An NPC is effectively a **Character** with the `ownerId` undefined and managed by a DM.  For clarity, the generator can produce NPCs with additional metadata:

* **role** – e.g., `MERCHANT`, `ALLY`, `ENEMY`.
* **challengeRating** – if the NPC is a creature/monster.
* **lootTable** – list of potential items dropped upon defeat.

### DMNote and Link

The DM zone will allow linking any entities (locations, quests, NPCs, notes) in a graph.  A **DMNote** is a free‑form document that can link to entities via **Link** objects.  Each link records the relationship type (e.g., “leads to,” “located in,” “ally of”) and the ids of the connected entities.

## Relationships Overview

* A **User** can own multiple **Characters** (player characters).  A DM user owns **Campaigns**.
* A **Character** has one **Inventory**, many **Spell** references, and belongs to zero or one **Campaigns**.  An NPC is a special type of character associated with a campaign and no user.
* **Campaigns** contain many **Quests**, **Sessions**, **NPCs** and **Locations**.  They are managed by one DM and involve multiple player users.
* **Quests** reference **NPCs** and **Locations** and reward **Items** and experience.  A quest may depend on other quests.
* **Sessions** record **GameEvents** and link characters, inventories and notes.  They live within a campaign.
* **Items**, **Spells** and **Features** are reusable across characters and campaigns.  Spells and items can be imported from external SRD APIs【480057457452803†L29-L41】.
* **GeneratorRequests** produce **GeneratedEntities**, which then become new domain objects (NPC, Location, Item, etc.).

This domain model offers a foundation for the initial development phase.  As the application evolves, new entities (e.g., factions, schedules, craftable items, skill checks) can be added in their bounded contexts.  The microservice or modular boundaries ensure that each domain can grow independently without impacting the others.