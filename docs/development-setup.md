# Development Setup Guide

This guide provides step-by-step instructions for setting up the D&D Companion development environment.

## Prerequisites

### System Requirements

- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 15 or higher
- **Git**: Latest version
- **Docker**: Optional, for containerized development

### Operating System Support

- **Windows**: Windows 10/11 with WSL2 recommended
- **macOS**: macOS 12 or higher
- **Linux**: Ubuntu 20.04+, CentOS 8+, or equivalent

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dnd-companion.git
cd dnd-companion
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ../..
```

### 3. Set Up Environment Variables

Create `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://dnd:dndpass@localhost:5432/dnd_companion"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Frontend
FRONTEND_URL="http://localhost:3000"

# Server
PORT=3002
NODE_ENV="development"
```

### 4. Set Up PostgreSQL Database

#### Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name dnd-postgres \
  -e POSTGRES_USER=dnd \
  -e POSTGRES_PASSWORD=dndpass \
  -e POSTGRES_DB=dnd_companion \
  -p 5432:5432 \
  -d postgres:15-alpine

# Or using Docker Compose
docker-compose up -d postgres
```

#### Using Local PostgreSQL

```bash
# Create database
createdb dnd_companion

# Create user (as postgres superuser)
createuser dnd --createdb --login
psql -c "ALTER USER dnd PASSWORD 'dndpass';"
```

### 5. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend only
cd apps/backend && npm run dev

# Frontend only
cd apps/frontend && npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Database**: localhost:5432 (if using Docker)

## Detailed Setup Instructions

### Backend Setup

The backend is built with NestJS and uses TypeScript.

#### Dependencies

```json
{
  "@nestjs/common": "^11.1.8",
  "@nestjs/core": "^11.1.8",
  "@nestjs/platform-express": "^11.1.8",
  "@prisma/client": "^6.19.0",
  "prisma": "^6.19.0",
  "bcrypt": "^5.1.1",
  "class-transformer": "^0.5.1",
  "class-validator": "^0.14.1",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
}
```

#### Key Files

```
apps/backend/
├── src/
│   ├── app.module.ts          # Main application module
│   ├── main.ts                # Application entry point
│   ├── prisma.service.ts      # Database service
│   ├── common/                # Shared utilities
│   │   ├── middleware/
│   │   ├── logging/
│   │   └── prisma/
│   └── modules/               # Feature modules
│       ├── auth/
│       ├── user/
│       ├── character/
│       └── ...
├── test/                      # E2E tests
├── jest.config.js
├── tsconfig.json
└── package.json
```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "nest start --watch",
    "start": "node dist/main.js",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  }
}
```

### Frontend Setup

The frontend is built with Next.js 16 and React 19.

#### Dependencies

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "next-themes": "^0.4.6",
  "@hookform/resolvers": "^5.2.2",
  "react-hook-form": "^7.66.0",
  "zod": "^4.1.12",
  "axios": "^1.13.2",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "jest-environment-jsdom": "^30.2.0"
}
```

#### Key Files

```
apps/frontend/
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles
│   │   └── (routes)/          # Route groups
│   ├── components/            # React components
│   │   ├── CharacterList.tsx
│   │   ├── CharacterBuilder.tsx
│   │   └── ...
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                   # Utilities
│   │   ├── api/               # API client
│   │   └── validations/       # Form validations
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── jest.config.js
├── jest.setup.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Docker Development

### Using Docker Compose

The project includes a `docker-compose.yml` for full containerized development:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: dnd
      POSTGRES_PASSWORD: dndpass
      POSTGRES_DB: dnd_companion
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://dnd:dndpass@postgres:5432/dnd_companion
      - PORT=3002
    ports:
      - "3002:3002"
    volumes:
      - ./apps/backend:/app/apps/backend
      - ./prisma:/app/prisma
    command: sh -c "npx prisma generate && npx prisma migrate deploy && cd apps/backend && npm run dev"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend:/app/apps/frontend
    command: sh -c "cd apps/frontend && npm run dev"
```

### Running with Docker

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

## Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Reset database (WARNING: destroys data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes (development only)
npm run db:push

# Seed database
npm run db:seed
```

### Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- **User**: Authentication and profile data
- **Character**: Player and NPC characters
- **Campaign**: Game campaigns
- **Quest**: Campaign objectives
- **Session**: Game sessions
- **Inventory/Item**: Equipment and items
- **Spell**: Spell definitions
- **Location**: Campaign locations
- **GameEvent**: Audit trail of game events

### Sample Data

To populate the database with sample data:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { Role, Race, CharacterClass } from "../src/common/types";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@dnd-companion.com",
      username: "demo",
      passwordHash: "$2b$10$...", // hashed 'demo123'
      roles: [Role.PLAYER],
    },
  });

  // Create sample character
  await prisma.character.create({
    data: {
      name: "Demo Warrior",
      race: Race.HUMAN,
      class: CharacterClass.FIGHTER,
      level: 3,
      ownerId: user.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Testing Setup

### Running Tests

```bash
# Run all tests
npm run test

# Run backend tests only
cd apps/backend && npm run test

# Run frontend tests only
cd apps/frontend && npm run test

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage reports
npm run test:cov
```

### Test Configuration

Tests use Jest with the following configurations:

- **Backend**: Node.js environment, focuses on services and controllers
- **Frontend**: jsdom environment, focuses on components and hooks
- **E2E**: Full application testing with Supertest

## Code Quality Tools

### Linting

```bash
# Lint backend
cd apps/backend && npm run lint

# Lint frontend
cd apps/frontend && npm run lint

# Lint all
npm run lint
```

### Type Checking

```bash
# Type check backend
cd apps/backend && npx tsc --noEmit

# Type check frontend
cd apps/frontend && npm run type-check
```

## IDE Setup

### Visual Studio Code

Recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "prisma.prisma",
    "ms-vscode-remote.remote-containers",
    "ms-playwright.playwright"
  ]
}
```

### VS Code Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Find process using port
lsof -i :3000
lsof -i :3002
lsof -i :5432

# Kill process
kill -9 <PID>
```

**Database connection issues:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs dnd-postgres

# Test connection
psql -h localhost -U dnd -d dnd_companion
```

**Module not found errors:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**

```bash
# Regenerate Prisma client
npm run db:generate

# Clear TypeScript cache
npx tsc --build --clean
```

### Environment Variables

Ensure all required environment variables are set:

```bash
# Check environment
printenv | grep -E "(DATABASE|JWT|FRONTEND|PORT)"

# Or create .env file
cp .env.example .env
# Edit .env with your values
```

### Performance Issues

**Slow builds:**

- Use Docker for consistent environments
- Enable build caching in Docker
- Use `npm ci` instead of `npm install` in CI

**Slow tests:**

- Run tests in parallel
- Use test database instead of production
- Mock external API calls

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and write tests
3. Run tests: `npm run test`
4. Lint code: `npm run lint`
5. Commit changes: `git commit -m "Add my feature"`
6. Push branch: `git push origin feature/my-feature`
7. Create pull request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commits

### Pre-commit Hooks

Set up pre-commit hooks to ensure code quality:

```bash
# Install husky
npm install husky --save-dev

# Initialize git hooks
npx husky install

# Add pre-commit hook
echo '#!/usr/bin/env sh
npm run lint
npm run test' > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Deployment

### Local Production Build

```bash
# Build backend
cd apps/backend && npm run build

# Build frontend
cd ../frontend && npm run build

# Start production servers
cd ../backend && npm start
cd ../frontend && npm start
```

### Docker Production

```bash
# Build production images
docker build -f Dockerfile.backend -t dnd-backend .
docker build -f Dockerfile.frontend -t dnd-frontend .

# Run production containers
docker run -d -p 3002:3002 dnd-backend
docker run -d -p 3000:3000 dnd-frontend
```

For full production deployment instructions, see the [Deployment Guide](deployment.md).
