# Testing Guide

This document outlines the testing strategy and procedures for the D&D Companion application.

## Testing Overview

The application uses a comprehensive testing strategy with multiple layers of testing to ensure code quality and prevent regressions.

## Testing Pyramid

```
End-to-End Tests (E2E)
    ↕️
Integration Tests
    ↕️
Unit Tests
```

## Test Categories

### Unit Tests

Unit tests focus on individual functions, methods, and components in isolation.

**Location:** `apps/backend/src/**/*.spec.ts`, `apps/frontend/src/**/*.test.tsx`

**Framework:** Jest

**Coverage Goals:**

- Backend: 80% statement coverage
- Frontend: 70% statement coverage
- Critical business logic: 90% coverage

**Example Unit Test:**

```typescript
describe("CharacterService", () => {
  let service: CharacterService;
  let mockPrisma: MockPrismaClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it("should create a character", async () => {
    const createDto = {
      name: "Test Character",
      race: Race.HUMAN,
      class: CharacterClass.FIGHTER,
      // ... other properties
    };

    mockPrisma.character.create.mockResolvedValue(mockCharacter);

    const result = await service.create(createDto, userId);
    expect(result).toEqual(mockCharacter);
  });
});
```

### Integration Tests

Integration tests verify that different parts of the system work together correctly.

**Location:** `apps/backend/test/*.e2e-spec.ts`

**Framework:** Jest + Supertest

**Focus Areas:**

- API endpoints
- Database operations
- Service interactions
- Authentication flows

**Example Integration Test:**

```typescript
describe("Character API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Setup test data and authentication
    await prisma.user.deleteMany();
    const user = await createTestUser();
    accessToken = await loginUser(user);
  });

  it("should create and retrieve character", () => {
    const characterData = {
      name: "E2E Test Character",
      race: "HUMAN",
      class: "FIGHTER",
      level: 1,
    };

    return request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(characterData)
      .expect(201)
      .then((res) => {
        const characterId = res.body.id;
        return request(app.getHttpServer())
          .get(`/characters/${characterId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe(characterData.name);
          });
      });
  });
});
```

### End-to-End Tests

E2E tests simulate real user interactions from the browser.

**Location:** `apps/frontend/src/__tests__/e2e/`

**Framework:** Playwright or Cypress

**Scenarios:**

- User registration and login
- Character creation workflow
- Campaign management
- Real-time updates

**Example E2E Test:**

```typescript
test("user can create and view character", async ({ page }) => {
  // Navigate to app
  await page.goto("http://localhost:3000");

  // Register new user
  await page.click("text=Sign Up");
  await page.fill("[name=email]", "test@example.com");
  await page.fill("[name=password]", "password123");
  await page.click("button[type=submit]");

  // Navigate to characters
  await page.click("text=Characters");

  // Create new character
  await page.click("text=Create Character");
  await page.fill("[name=name]", "Test Warrior");
  await page.selectOption("[name=race]", "HUMAN");
  await page.selectOption("[name=class]", "FIGHTER");
  await page.click("text=Create");

  // Verify character appears in list
  await expect(page.locator("text=Test Warrior")).toBeVisible();
});
```

## Frontend Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import CharacterList from "@/components/CharacterList";

const mockCharacters = [
  { id: "1", name: "Test Character", level: 3, class: "FIGHTER" },
];

describe("CharacterList", () => {
  it("renders character list", () => {
    render(<CharacterList characters={mockCharacters} />);

    expect(screen.getByText("Test Character")).toBeInTheDocument();
    expect(screen.getByText("Level 3 Fighter")).toBeInTheDocument();
  });

  it("calls onCharacterSelect when character is clicked", () => {
    const mockOnSelect = jest.fn();
    render(
      <CharacterList
        characters={mockCharacters}
        onCharacterSelect={mockOnSelect}
      />,
    );

    fireEvent.click(screen.getByText("Test Character"));
    expect(mockOnSelect).toHaveBeenCalledWith(mockCharacters[0]);
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/contexts/AuthContext";

describe("useAuth", () => {
  it("should initialize with null user", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it("should login user", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});
```

### API Testing

```typescript
import { characterApi } from "@/lib/api/character";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("characterApi", () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  it("should fetch characters", async () => {
    const mockCharacters = [{ id: "1", name: "Test" }];
    mockedAxios.get.mockResolvedValue({ data: mockCharacters });

    const result = await characterApi.getAll();
    expect(result).toEqual(mockCharacters);
    expect(mockedAxios.get).toHaveBeenCalledWith("/characters");
  });
});
```

## Backend Testing

### Service Testing

```typescript
describe("CharacterService", () => {
  let service: CharacterService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CharacterService, PrismaService],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await prisma.character.deleteMany();
  });

  it("should create character with valid data", async () => {
    const createDto = {
      name: "Valid Character",
      race: Race.HUMAN,
      class: CharacterClass.FIGHTER,
      level: 1,
    };

    const result = await service.create(createDto, userId);
    expect(result.name).toBe(createDto.name);
    expect(result.race).toBe(createDto.race);
  });

  it("should throw error for invalid ability scores", async () => {
    const invalidDto = {
      name: "Invalid Character",
      race: Race.HUMAN,
      class: CharacterClass.FIGHTER,
      level: 1,
      abilityScores: {
        strength: 25, // Invalid: max 20
      },
    };

    await expect(service.create(invalidDto, userId)).rejects.toThrow();
  });
});
```

### Controller Testing

```typescript
describe("CharacterController", () => {
  let controller: CharacterController;
  let service: CharacterService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        {
          provide: CharacterService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
    service = module.get<CharacterService>(CharacterService);
  });

  it("should create character", async () => {
    const createDto = { name: "Test", race: Race.HUMAN };
    const mockResult = { id: "1", ...createDto };
    const mockRequest = { user: { id: "user-1" } };

    jest.spyOn(service, "create").mockResolvedValue(mockResult);

    const result = await controller.create(createDto, mockRequest);
    expect(result).toEqual(mockResult);
    expect(service.create).toHaveBeenCalledWith(createDto, "user-1");
  });
});
```

## Test Data Management

### Test Database

- Use separate test database
- Clean up data between tests
- Use transactions for isolation

```typescript
beforeEach(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany();
    await tx.character.deleteMany();
    // Create test data
  });
});
```

### Factory Functions

```typescript
export const createTestUser = async (prisma: PrismaService) => {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      passwordHash: await bcrypt.hash("password123", 10),
      roles: [Role.PLAYER],
    },
  });
};

export const createTestCharacter = async (
  prisma: PrismaService,
  userId: string,
) => {
  return prisma.character.create({
    data: {
      name: "Test Character",
      race: Race.HUMAN,
      class: CharacterClass.FIGHTER,
      level: 1,
      ownerId: userId,
    },
  });
};
```

## Test Configuration

### Jest Configuration

**Backend (`apps/backend/jest.config.js`):**

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.spec.ts", "!src/main.ts"],
  coverageDirectory: "../../coverage/backend",
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/*.spec.ts"],
};
```

**Frontend (`apps/frontend/jest.config.js`):**

```javascript
module.exports = {
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
  ],
  coverageDirectory: "../../coverage/frontend",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:frontend": "cd apps/frontend && npm run test",
    "test:backend": "cd apps/backend && npm run test"
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run backend tests
        run: cd apps/backend && npm run test:cov

      - name: Run frontend tests
        run: cd apps/frontend && npm run test:cov

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Testing

### Load Testing

```typescript
import { check } from "k6";
import http from "k6/http";

export let options = {
  vus: 10,
  duration: "30s",
};

export default function () {
  const response = http.get("http://localhost:3002/characters");
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

### Database Performance

```sql
-- Query performance analysis
EXPLAIN ANALYZE SELECT * FROM "Character" WHERE "ownerId" = $1;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## Test Maintenance

### Test Organization

```
apps/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.spec.ts
│   │   │   │   └── auth.controller.spec.ts
│   │   └── common/
│   │       └── prisma/
│   │           └── prisma.service.spec.ts
│   └── test/
│       ├── user.e2e-spec.ts
│       └── character.e2e-spec.ts
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CharacterList.test.tsx
    │   │   └── CharacterBuilder.test.tsx
    │   ├── contexts/
    │   │   └── AuthContext.test.tsx
    │   └── lib/
    │       └── api/
    │           └── character.test.ts
    └── __tests__/
        └── e2e/
            └── character-creation.spec.ts
```

### Test Naming Conventions

- **Unit tests:** `*.spec.ts` or `*.test.ts`
- **Integration tests:** `*.e2e-spec.ts`
- **E2E tests:** `*.spec.ts` in `__tests__/e2e/`

### Test Documentation

```typescript
describe("CharacterService - Character Creation", () => {
  describe("create()", () => {
    it("should create a valid character with all required fields", async () => {
      // Test implementation
    });

    it("should throw ValidationException for invalid ability scores", async () => {
      // Test implementation
    });

    it("should associate character with correct user", async () => {
      // Test implementation
    });
  });
});
```

## Debugging Tests

### Common Issues

**Flaky Tests:**

- Use proper cleanup between tests
- Avoid dependencies on external services
- Use deterministic data

**Slow Tests:**

- Mock external dependencies
- Use in-memory databases for unit tests
- Parallelize test execution

**False Positives:**

- Ensure test data is isolated
- Use proper assertions
- Check for race conditions

### Debugging Tools

```typescript
// Debug logging in tests
console.log("Test data:", testData);

// Time execution
const start = Date.now();
// ... test code
const duration = Date.now() - start;
console.log(`Test took ${duration}ms`);
```

## Best Practices

### Test Structure

1. **Arrange:** Set up test data and mocks
2. **Act:** Execute the code under test
3. **Assert:** Verify the expected behavior

### Test Isolation

- Each test should be independent
- Use unique test data
- Clean up after each test

### Test Coverage

- Aim for meaningful coverage, not just percentages
- Focus on critical paths and edge cases
- Use coverage reports to identify gaps

### Continuous Testing

- Run tests on every commit
- Fail builds on test failures
- Monitor test performance trends
- Update tests when refactoring code
