# Backend Modules Documentation

This document provides detailed information about each backend module in the D&D Companion application.

## Module Overview

The backend is organized into feature-based modules following Domain-Driven Design principles. Each module encapsulates a specific business domain with its own:

- Controllers (API endpoints)
- Services (business logic)
- DTOs (data transfer objects)
- Entities/Models (data structures)
- Tests (unit and integration tests)

## Core Modules

### Auth Module

**Purpose**: Handles user authentication, authorization, and session management.

**Key Components**:

- `AuthController`: Login, logout, demo login endpoints
- `AuthService`: JWT token generation, validation, password hashing
- `JwtStrategy`: Passport.js JWT strategy for token validation
- `RolesGuard`: Role-based access control
- `DemoSeederService`: Creates demo user and sample data

**API Endpoints**:

```typescript
POST / auth / login; // User login
POST / auth / demo; // Demo login
POST / users / register; // User registration
GET / users / profile; // Get user profile
PUT / users / profile; // Update user profile
```

**Key Features**:

- JWT authentication with 24-hour expiration
- Password hashing with bcrypt
- Role-based permissions (PLAYER, DM, ADMIN)
- Demo user system for testing
- Automatic last login tracking

### User Module

**Purpose**: Manages user accounts and profiles.

**Key Components**:

- `UserController`: User CRUD operations
- `UserService`: User business logic and validation
- `UserRepository`: Data access layer

**Features**:

- User registration with email validation
- Profile management (display name, locale, avatar)
- Subscription tier support (FREE, PREMIUM, ENTERPRISE)
- User search and filtering

### Character Module

**Purpose**: Core character management functionality.

**Key Components**:

- `CharacterController`: Character CRUD and spell management
- `CharacterService`: Character business logic
- `CharacterRepository`: Database operations

**API Endpoints**:

```typescript
GET    /characters           // List user characters
POST   /characters           // Create character
GET    /characters/:id       // Get character details
PATCH  /characters/:id       // Update character
DELETE /characters/:id       // Delete character

# Spell Management
POST   /characters/:id/spells/learn     // Learn spell
DELETE /characters/:id/spells/learn/:spellId  // Unlearn spell
POST   /characters/:id/spells/prepare   // Prepare spell
DELETE /characters/:id/spells/prepare/:spellId // Unprepare spell
PUT    /characters/:id/spell-slots      // Update spell slots
```

**Key Features**:

- Full D&D 5e character creation and management
- Ability scores, skills, and proficiency tracking
- Multiclass support
- Hit points, armor class, initiative calculation
- Spell casting and slot management
- Experience points and leveling

### Campaign Module

**Purpose**: Campaign creation and management.

**Key Components**:

- `CampaignController`: Campaign CRUD operations
- `CampaignService`: Campaign business logic
- `CampaignRepository`: Data access

**Features**:

- Campaign creation with DM assignment
- Player invitation and management
- Campaign metadata (name, description, quests, sessions)
- Active campaign tracking for characters

### Quest Module

**Purpose**: Quest tracking and management within campaigns.

**Key Components**:

- `QuestController`: Quest CRUD operations
- `QuestService`: Quest business logic

**Features**:

- Quest creation with objectives and rewards
- Progress tracking (NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED)
- Experience point and loot rewards
- NPC and location associations
- Character quest participation tracking

### Session Module

**Purpose**: Game session management and event logging.

**Key Components**:

- `SessionController`: Session operations
- `SessionService`: Session business logic

**Features**:

- Session creation and scheduling
- Game event logging (damage, healing, item transfers)
- Player character tracking per session
- Session notes and summaries

### Inventory Module

**Purpose**: Character and session inventory management.

**Key Components**:

- `InventoryController`: Inventory operations
- `InventoryService`: Inventory business logic

**API Endpoints**:

```typescript
GET    /inventory/:ownerType/:ownerId     // Get inventory
POST   /inventory/:ownerType/:ownerId/items  // Add item
PATCH  /inventory/items/:id               // Update item
DELETE /inventory/items/:id               // Remove item
```

**Features**:

- Character and session inventory support
- Item quantity and equipped status tracking
- Encumbrance calculation
- Item metadata and effects

### Item Module

**Purpose**: Item catalog and management.

**Key Components**:

- `ItemController`: Item CRUD operations
- `ItemService`: Item business logic

**Features**:

- Item catalog with D&D 5e items
- Rarity, type, and property tracking
- Weight and encumbrance calculations
- Item effects and modifiers

### Spell Module

**Purpose**: Spell catalog and management.

**Key Components**:

- `SpellController`: Spell operations
- `SpellService`: Spell business logic

**Features**:

- Complete D&D 5e spell database
- Spell filtering by class, level, school
- Casting requirements and effects
- Character spell list management

### Feature Module

**Purpose**: Character features, traits, and abilities.

**Key Components**:

- `FeatureController`: Feature operations
- `FeatureService`: Feature business logic

**Features**:

- Racial traits and class features
- Feats and background features
- Feature descriptions and mechanical effects
- Level requirements and prerequisites

### Events Module

**Purpose**: Event logging and real-time updates.

**Key Components**:

- `EventBusService`: Event publishing and subscription
- `EventLoggingService`: Event persistence
- `EventsController`: Event querying

**Features**:

- Event-driven architecture
- Game event logging (damage, healing, item transfers)
- Real-time notifications
- Event replay and audit trails

### Generator Module

**Purpose**: Content generation for campaigns and characters.

**Key Components**:

- `GeneratorController`: Generation requests
- `GeneratorService`: Content generation logic

**Features**:

- NPC generation
- Location generation
- Campaign idea generation
- Template-based content creation
- AI integration (planned)

### DM Zone Module

**Purpose**: Dungeon Master tools and world-building.

**Key Components**:

- `DMZoneController`: DM tools
- `DMZoneService`: DM functionality

**Features**:

- Note-taking and organization
- Graph-based relationship mapping
- Location and NPC management
- Campaign planning tools

## Common Patterns

### Controller Pattern

All controllers follow consistent patterns:

```typescript
@Controller("resource")
@UseGuards(JwtAuthGuard)
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  create(
    @Body() createDto: CreateResourceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.create(createDto, req.user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdateResourceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, updateDto, req.user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.service.remove(id, req.user.id);
  }
}
```

### Service Pattern

Services implement business logic with dependency injection:

```typescript
@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(createDto: CreateResourceDto, userId: string) {
    // Validation
    this.validateCreateDto(createDto);

    // Business logic
    const resource = await this.prisma.resource.create({
      data: {
        ...createDto,
        ownerId: userId,
      },
    });

    // Event publishing
    this.eventBus.publish("resource.created", {
      resourceId: resource.id,
      userId,
    });

    return resource;
  }
}
```

### DTO Pattern

Data Transfer Objects for API communication:

```typescript
// Create DTO
export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Race)
  race: Race;

  @IsEnum(CharacterClass)
  class: CharacterClass;

  @IsOptional()
  @IsString()
  background?: string;
}

// Response DTO
export class CharacterResponseDto {
  id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  hitPoints: HitPointsDto;
  currency: CurrencyDto;
  createdAt: Date;
  updatedAt: Date;
}
```

### Repository Pattern

Data access abstraction:

```typescript
@Injectable()
export class CharacterRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Character | null> {
    return this.prisma.character.findUnique({
      where: { id },
      include: {
        abilityScores: true,
        skillProficiencies: true,
        multiclasses: true,
      },
    });
  }

  async findByOwner(ownerId: string): Promise<Character[]> {
    return this.prisma.character.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(data: CreateCharacterData): Promise<Character> {
    return this.prisma.character.create({ data });
  }
}
```

## Module Dependencies

```
Auth Module
├── User Module (circular dependency handled with forwardRef)
└── Prisma Module

Character Module
├── Inventory Module
├── Events Module
└── Prisma Module

Campaign Module
├── Quest Module
├── Session Module
└── Prisma Module

Quest Module
├── Character Module
└── Prisma Module

Session Module
├── Events Module
└── Prisma Module

Inventory Module
├── Item Module
└── Prisma Module

All modules depend on:
- Prisma Module (database access)
- Auth Module (authentication guards)
```

## Testing Structure

Each module includes comprehensive tests:

### Unit Tests

- Service method testing with mocked dependencies
- Controller endpoint testing
- Utility function testing
- Validation logic testing

### Integration Tests

- Database integration testing
- API endpoint testing with real database
- Event publishing/consumption testing

### Test File Organization

```
modules/
├── module-name/
│   ├── module-name.controller.spec.ts
│   ├── module-name.service.spec.ts
│   ├── module-name.e2e-spec.ts
│   └── dto/
│       ├── create-dto.spec.ts
│       └── update-dto.spec.ts
```

## Error Handling

Consistent error handling across modules:

```typescript
@Injectable()
export class CharacterService {
  async findOne(id: string, userId: string) {
    const character = await this.characterRepo.findById(id);

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return character;
  }
}
```

## Performance Considerations

### Database Optimization

- Strategic indexing on frequently queried columns
- Efficient queries with proper select/includes
- Connection pooling with Prisma
- Query result caching where appropriate

### Caching Strategy

- Redis caching for frequently accessed data
- Application-level caching for computed values
- Cache invalidation on data updates

### Lazy Loading

- Optional relations loaded only when needed
- Pagination for large result sets
- Streaming for large exports

## Security Considerations

### Input Validation

- DTO validation with class-validator
- Sanitization of user inputs
- Type checking with TypeScript

### Access Control

- JWT authentication on all endpoints
- Role-based authorization with guards
- Owner-based access control
- Input sanitization and SQL injection prevention

### Audit Logging

- Important actions logged with user context
- Event-driven audit trail
- Compliance with data retention policies

## Future Enhancements

### Planned Module Additions

- **Notification Module**: Email and in-app notifications
- **Analytics Module**: Usage statistics and reporting
- **Integration Module**: Third-party service integrations
- **Subscription Module**: Premium feature management

### Module Evolution

- **Microservice Extraction**: High-traffic modules can be extracted
- **API Versioning**: Support for multiple API versions
- **GraphQL Support**: Alternative to REST for complex queries
- **Real-time Updates**: WebSocket support for live collaboration
