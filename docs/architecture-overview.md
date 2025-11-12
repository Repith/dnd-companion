# Architecture Overview

This document provides a detailed overview of the D&D Companion application architecture, including system design, component interactions, and technical decisions.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React 19      │    │ - REST/GraphQL  │    │ - Prisma ORM    │
│ - TypeScript    │    │ - JWT Auth      │    │ - Redis Cache   │
│ - Tailwind CSS  │    │ - Event Bus     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Event Bus     │
                    │   (Kafka/NATS)  │
                    └─────────────────┘
```

### Component Overview

#### Frontend Application

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + custom hooks
- **API Communication**: Axios with retry logic and error handling
- **Routing**: Next.js App Router with nested layouts

#### Backend Services

- **Framework**: NestJS with modular architecture
- **Language**: TypeScript with strict typing
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator with class-transformer
- **Documentation**: OpenAPI/Swagger (planned)

#### Database Layer

- **Primary Database**: PostgreSQL 15+
- **ORM**: Prisma with type-safe queries
- **Migrations**: Prisma Migrate for schema versioning
- **Caching**: Redis for session and application cache
- **Backup**: Automated daily backups with point-in-time recovery

## Application Structure

### Backend Module Organization

```
apps/backend/src/
├── app.module.ts                 # Root application module
├── main.ts                       # Application bootstrap
├── common/                       # Shared utilities
│   ├── middleware/               # Custom middleware
│   ├── guards/                   # Authentication/authorization guards
│   ├── interceptors/             # Request/response interceptors
│   ├── decorators/               # Custom decorators
│   ├── filters/                  # Exception filters
│   └── pipes/                    # Validation pipes
├── modules/                      # Feature modules
│   ├── auth/                     # Authentication & authorization
│   ├── user/                     # User management
│   ├── character/                # Character CRUD operations
│   ├── campaign/                 # Campaign management
│   ├── quest/                    # Quest tracking
│   ├── session/                  # Game session management
│   ├── inventory/                # Item and inventory management
│   ├── spell/                    # Spell catalog and management
│   ├── feature/                  # Character features and traits
│   ├── generator/                # Content generation
│   ├── events/                   # Event logging and bus
│   └── dm-zone/                  # DM tools and world-building
├── config/                       # Configuration management
├── types/                        # Shared type definitions
└── utils/                        # Utility functions
```

### Frontend Application Structure

```
apps/frontend/src/
├── app/                          # Next.js app router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   └── api/                      # API routes (if needed)
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   └── domain/                   # Domain-specific components
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   └── ThemeContext.tsx          # Theme management
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hooks
│   ├── useApi.ts                 # API interaction hooks
│   └── useLocalStorage.ts        # Storage utilities
├── lib/                          # Utilities and configurations
│   ├── api/                      # API client and endpoints
│   ├── validations/              # Form validation schemas
│   ├── utils/                    # General utilities
│   └── constants/                # Application constants
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API response types
│   ├── components.ts             # Component prop types
│   └── domain.ts                 # Domain model types
├── styles/                       # Additional styles
└── __tests__/                    # Test files
```

## Key Design Patterns

### Domain-Driven Design (DDD)

The application follows DDD principles with bounded contexts:

- **User Context**: Authentication, profiles, roles
- **Character Context**: Character creation, stats, progression
- **Campaign Context**: Campaign management, sessions, quests
- **Inventory Context**: Items, equipment, currency
- **Generator Context**: Content generation and templates

Each bounded context has:

- Dedicated database schema
- Independent business logic
- Clear interfaces and contracts
- Isolated testing

### Event-Driven Architecture

The system uses events for decoupling and real-time updates:

```typescript
// Event publishing
@Injectable()
export class CharacterService {
  constructor(private eventBus: EventBus) {}

  async updateHitPoints(characterId: string, newHp: number) {
    // Update character
    const character = await this.updateHp(characterId, newHp);

    // Publish event
    this.eventBus.publish("character.hp.changed", {
      characterId,
      oldHp: character.hitPoints.current,
      newHp,
      change: newHp - character.hitPoints.current,
    });

    return character;
  }
}

// Event subscription
@Injectable()
export class CampaignService {
  @OnEvent("character.hp.changed")
  async handleHpChange(payload: any) {
    // Update campaign state
    // Send real-time updates to players
    // Log for DM dashboard
  }
}
```

### Repository Pattern

Data access is abstracted through repository interfaces:

```typescript
export interface CharacterRepository {
  findById(id: string): Promise<Character | null>;
  findByOwner(ownerId: string): Promise<Character[]>;
  create(data: CreateCharacterDto): Promise<Character>;
  update(id: string, data: UpdateCharacterDto): Promise<Character>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class PrismaCharacterRepository implements CharacterRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Character | null> {
    return this.prisma.character.findUnique({
      where: { id },
      include: { abilityScores: true, skills: true },
    });
  }
  // ... implementation
}
```

### Dependency Injection

NestJS DI container manages dependencies:

```typescript
@Injectable()
export class CharacterService {
  constructor(
    private characterRepo: CharacterRepository,
    private eventBus: EventBus,
    private validator: CharacterValidator,
  ) {}
}
```

## Data Flow Patterns

### Request Flow

```
Client Request
      ↓
  Middleware (CORS, Security, Logging)
      ↓
  Guards (Authentication, Authorization)
      ↓
  Interceptors (Transformation, Caching)
      ↓
  Controller (Route handling)
      ↓
  Service (Business logic)
      ↓
  Repository (Data access)
      ↓
  Database
```

### Event Flow

```
User Action
      ↓
  Service Method
      ↓
  Business Logic Execution
      ↓
  Event Publication
      ↓
  Event Handlers
      ↓
  Side Effects (Notifications, Updates, Logging)
```

## Security Architecture

### Authentication Layers

1. **Transport Security**: HTTPS with TLS 1.3
2. **API Security**: JWT tokens with expiration
3. **Request Security**: Rate limiting and input validation
4. **Data Security**: Encrypted passwords and sensitive data

### Authorization Model

Role-Based Access Control (RBAC):

```typescript
export enum Role {
  PLAYER = "PLAYER", // Basic user permissions
  DM = "DM", // Dungeon Master permissions
  ADMIN = "ADMIN", // Administrative permissions
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Performance Optimizations

### Database Optimizations

- **Indexing Strategy**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient queries with proper joins and selections
- **Connection Pooling**: Prisma connection pooling for database efficiency
- **Caching**: Redis for session storage and frequently accessed data

### Application Optimizations

- **Response Compression**: Gzip compression for API responses
- **Caching Headers**: Appropriate cache headers for static assets
- **Lazy Loading**: Code splitting and lazy component loading
- **Image Optimization**: Next.js image optimization for frontend assets

### Infrastructure Optimizations

- **Container Optimization**: Multi-stage Docker builds for smaller images
- **Horizontal Scaling**: Stateless services that can scale horizontally
- **Load Balancing**: Nginx for request distribution
- **CDN**: Static asset delivery through CDN

## Scalability Considerations

### Horizontal Scaling

The architecture supports horizontal scaling:

- **Stateless Services**: All services are stateless and can be scaled independently
- **Database Sharding**: Future support for database sharding by user regions
- **Microservices Ready**: Modular design allows extraction of services as needed
- **Event-Driven**: Loose coupling through events enables independent scaling

### Vertical Scaling

- **Resource Limits**: Configurable resource limits for containers
- **Auto-scaling**: Kubernetes HPA for automatic scaling based on metrics
- **Performance Monitoring**: Real-time monitoring of resource usage
- **Capacity Planning**: Regular assessment of scaling needs

## Monitoring and Observability

### Application Metrics

```typescript
@Injectable()
export class MetricsService {
  private readonly counter = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  incrementRequest(method: string, route: string, statusCode: number) {
    this.counter.inc({ method, route, status_code: statusCode });
  }
}
```

### Logging Strategy

Structured logging with correlation IDs:

```typescript
@Injectable()
export class LoggerService {
  private readonly logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "app.log" }),
    ],
  });

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, {
      correlationId: this.getCorrelationId(),
      ...meta,
    });
  }
}
```

### Health Checks

Comprehensive health endpoints:

```typescript
@Controller("health")
export class HealthController {
  constructor(private db: PrismaService, private redis: RedisService) {}

  @Get()
  async getHealth() {
    const dbHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();

    return {
      status: dbHealth && redisHealth ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };
  }
}
```

## Error Handling

### Global Error Handling

```typescript
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      message = "Unauthorized";
    }

    this.logger.error("Exception caught", {
      exception: exception.message,
      stack: exception.stack,
      url: request.url,
      method: request.method,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Client Error Handling

```typescript
// API client with retry logic
export class ApiClient {
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.request<T>({
        ...config,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          this.handleUnauthorized();
        } else if (error.response?.status >= 500) {
          // Retry server errors
          return this.retryRequest(config);
        }
      }
      throw error;
    }
  }
}
```

## Development Workflow

### Local Development

- **Hot Reload**: Both frontend and backend support hot reloading
- **Docker Development**: Consistent environment with Docker Compose
- **Database Seeding**: Demo data for development and testing
- **API Documentation**: Auto-generated API docs with Swagger

### Testing Strategy

- **Unit Tests**: Isolated testing of functions and classes
- **Integration Tests**: Testing of component interactions
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load testing and performance validation

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test
      - name: Build
        run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

## Future Architecture Considerations

### Microservices Evolution

The modular monolith design allows gradual evolution to microservices:

1. **Extract High-Traffic Services**: Character and inventory services
2. **Database Splitting**: Separate databases for different bounded contexts
3. **Event-Driven Communication**: Async communication between services
4. **API Gateway**: Centralized API management and routing

### Advanced Features

- **AI Integration**: Content generation with OpenAI
- **Real-time Collaboration**: WebSocket support for live sessions
- **Offline Support**: Service worker for offline functionality
- **Multi-tenancy**: Support for multiple game systems

### Performance Enhancements

- **GraphQL**: More efficient data fetching
- **Edge Computing**: Global CDN with edge functions
- **Advanced Caching**: Multi-layer caching strategy
- **Database Optimization**: Read replicas and query optimization

This architecture provides a solid foundation that can scale with the application's growth while maintaining code quality and developer productivity.
