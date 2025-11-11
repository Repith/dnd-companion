# DnD Companion

## Project Overview

DnD Companion is a comprehensive web application designed to assist both players and Dungeon Masters (DMs) in managing Dungeons & Dragons 5e campaigns.  The system is built as a **modular monolith** that can evolve into a microservices architecture as the product matures.  At its core, the application consists of a Next.js front‑end and a NestJS back‑end, with PostgreSQL (via Prisma ORM) for structured data and Kafka for event streaming.  Monitoring and observability are handled via Prometheus and Grafana.

Key objectives:

- Provide rich character management with full support for classes, races, abilities, skills, items, spells and quests.
- Offer a powerful DM zone for campaign planning, session tracking, NPC and quest generation, and event‑driven state updates.
- Lay the groundwork for subscription tiers and internationalisation without locking in business logic prematurely.
- Maintain a codebase that follows modern best practices (TypeScript, strict typing, modular architecture, automated CI/CD) to enable long‑term maintainability and scalability.

This repository contains the documentation that defines the architecture, domain model, and project plan.  Future commits will introduce the code for the front‑end, back‑end, database schemas and infrastructure configuration.

## Repository Structure

```
dnd-companion/
│
├── docs/                  # Project documentation
│   ├── overview.md        # High‑level project overview and goals
│   ├── architecture.md    # Solution architecture and technology choices
│   ├── domain-model.md    # Domain entities and their relationships
│   └── work-plan.md       # Phase planning and task assignments
│
├── prisma/                # Prisma schema and migrations
│   └── schema.prisma
│
├── docker-compose.yml     # Local development stack (Postgres, Kafka, Grafana/Prometheus)
│
├── .gitignore             # Ignore generated files and sensitive data
│
└── README.md              # You are here
```

## Getting Started

> **Note:** Full application code will be added in subsequent phases.  These instructions prepare the environment for future services.

1. **Clone the repository** and install dependencies:

   ```bash
   git clone https://github.com/Repith/dnd-companion.git
   cd dnd-companion
   # Node.js and npm must be installed
   npm install -g pnpm
   pnpm install
   ```

2. **Start the development stack** using Docker Compose:

   ```bash
   docker compose up -d
   ```

   This launches PostgreSQL, Kafka (with Zookeeper), Prometheus, and Grafana.  Once running, Grafana dashboards will be accessible at `http://localhost:3000` (credentials: admin/admin).  Prometheus scrapes metrics from your services for real‑time monitoring.

3. **Generate Prisma client** and apply migrations:

   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

   The initial `schema.prisma` file defines the core domain entities and enumerations.  You can inspect and modify this file under the `prisma/` directory.

4. **Plan your next steps:**

   - Implement the NestJS API under `apps/backend` and configure it to use Prisma and Kafka.
   - Scaffold the Next.js application under `apps/frontend` using the latest App Router and Server Actions.
   - Integrate OpenAPI definitions for the generator service and plan event sourcing for character and session state.

## Contributing

1. **Branching strategy:** use feature branches off of `main` for all new work.  Keep commits small and focused on a single change.  Use conventional commit messages where possible.
2. **Linting and formatting:** configure ESLint and Prettier once the codebase is scaffolded.  CI will enforce these checks on pull requests.
3. **Testing:** aim for unit tests on business logic and integration tests on API endpoints.  Use Jest and Supertest for NestJS, and React Testing Library for the Next.js front‑end.

## Documentation

Comprehensive documentation is stored in the `docs/` folder.  You can render these Markdown files directly in GitHub or through your IDE.  They include project context, architectural decisions, domain definitions, and the work plan for each phase.

## License

This project is currently private and governed by the owner’s licensing terms.  When open‑sourced, it will include an appropriate license file.