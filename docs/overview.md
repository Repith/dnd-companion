# Project Overview – DnD Companion Application

## Vision

The **DnD Companion** project aims to build a modern, extensible assistant for players and Dungeon Masters (DMs) running **Dungeons & Dragons 5e** games.  Table‑top RPGs involve a huge amount of record‑keeping – character statistics, equipment lists, spells, quests, non‑player characters (NPCs), and campaign notes.  Existing tools often solve one narrow problem (e.g., character sheets or dice rollers) but lack an integrated, modular platform that can grow with a campaign and adapt to different play styles.  

The long‑term vision is to deliver a **single front‑end with modular back‑end services** that allow gamers to:

* **Create and manage characters** with full DnD 5e attributes (race, class, level, ability scores, skills, hit dice, experience points, etc. 【610953689760937†L33-L67】).  Characters will have inventories, spells and features, equipment affecting statistics, and connections to quests and NPCs.
* **Use a digital dice roller and track spell slots**, hit points and death saves – actions often performed manually on paper.
* **Browse, search and import content** from the open 5e System Reference Document (SRD) API for spells, monsters and items【480057457452803†L29-L41】.
* **Generate campaigns, locations and NPCs** through a flexible generator.  Initially, the generator will allow manual entry or JSON imports; the architecture reserves space for future AI‑powered content generation using large language models and prompt‑based tools.
* **Support a DM zone** where DMs can plan campaigns, sessions and quests.  The DM zone will resemble digital note‑taking apps (e.g., Obsidian) with graphs linking locations, NPCs and story beats.  It will eventually support real‑time updates and event‑driven actions, such as applying damage or awarding experience to characters.

Unlike monolithic TTRPG tools, our solution will be **service‑oriented**.  Each domain (characters, quests, campaigns, generator, user management, etc.) will be implemented as an independent service communicating via APIs or event streams.  This design supports incremental development and allows services to be turned on/off or scaled independently【573398505092238†L1046-L1083】.  The architecture also allows for future subscription tiers and feature flags so that new modules can be enabled or disabled without redeploying the entire system.

## Problem Statement

Running a tabletop campaign requires juggling rules, story, and game mechanics.  Players often track information on paper while DMs use separate tools for world‑building, scheduling and rules reference.  Combining these tasks into a cohesive digital experience has proved challenging.  Many digital tools focus on either players or DMs, seldom both, and rarely support offline use or third‑party integrations.  Additionally, existing applications often treat all functionality as a single monolith, making it hard to roll out new features or scale only the parts that need more power.

Our project addresses these challenges by:

* **Implementing a modular architecture** following microservices principles.  Each service will have a single responsibility and be deployable and scalable independently【573398505092238†L968-L1045】.  Services will communicate through REST or GraphQL APIs and an event bus.  A gateway will expose a unified API to the front‑end.
* **Aligning with current best practices** from 2025 software engineering.  The project will leverage TypeScript for type safety, adopt a monorepo with Next.js for React 19 server components, use GraphQL to reduce over‑ and under‑fetching of data【151303706255818†L130-L146】, and support serverless or container‑based deployments.  AI/ML features and event‑driven design will be planned from the outset but added incrementally【151303706255818†L190-L205】.
* **Focusing on user roles**.  A user can be a player, DM or both.  Authentication and authorization will control access to data and features.  In the future, subscription levels will unlock premium content; therefore the architecture will include a skeleton for subscription management without implementing it immediately.

## Target Audience

* **Players** who want a digital character sheet with inventory, spells, quest tracking and dice rolling.  They should be able to create, level up and manage characters across multiple campaigns.
* **Dungeon Masters** who need tools for world‑building, session preparation, NPC and encounter generation and event‑driven control during a game.  They need to plan and record campaigns while sharing selected information with players.
* **Content creators and tool integrators** who may extend the platform by adding new services or linking existing data (e.g., adding a voice‑chat integration, map tools or AI content generation).  Open APIs and event streams will make integration possible.

## High‑Level Features

1. **User Management and Security** – registration and login with role‑based access control (player, DM, admin).  Later, subscription tiers will be layered on top.
2. **Character Service** – create and manage characters with DnD attributes including personal traits, ability scores, skills, hit points, spell slots, inventory and back‑story【610953689760937†L0-L23】【610953689760937†L81-L87】.  Provide digital dice roller and tracking of spell slots and death saves.
3. **Inventory and Items** – handle items with attributes that affect a character (e.g., weapons, armor, magical items).  Items will be stored in a separate service with metadata such as weight, rarity, attunement and effects.
4. **Spells and Skills** – list spells and class abilities; integrate with the 5e SRD API【480057457452803†L29-L41】 for canonical data and allow custom homebrew entries.
5. **Quest and Campaign Service** – manage quests, track progress, rewards (experience, items) and notes.  Campaigns will group quests, NPCs, locations and sessions.  Sessions record game logs, timeline events and notes.
6. **Generator Service** – build or import campaigns, NPCs, locations, items and spells.  Initially support manual input or JSON templates; future versions will integrate with AI models to generate content based on prompts.
7. **DM Zone** – provide world‑building and session management tools.  It will support graph‑based organization of campaign components similar to knowledge‑graph note‑taking apps.  DMs will manage events (damage, item transfers) that propagate to player dashboards in real time via event streams.
8. **API and Event Bus** – unify service APIs through a gateway (REST or GraphQL) and implement an event‑driven architecture to handle real‑time updates.  Events will propagate through an event broker such as Kafka or Pulsar【632039201491544†L418-L435】.
9. **Observability and Telemetry** – incorporate monitoring, logging and tracing from day one to enable debugging and performance tuning.  Service mesh technology will provide secure and observable inter‑service communication【369249732528978†L509-L537】.

These features represent the first stage of a long‑term roadmap.  The design emphasises incremental growth, ease of maintenance and the ability to integrate future technologies (like AI content generation) without disrupting existing functionality.