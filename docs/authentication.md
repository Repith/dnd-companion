# Authentication Guide

This document describes the authentication and authorization system used in the D&D Companion application.

## Overview

The application uses JWT (JSON Web Tokens) for authentication with role-based access control (RBAC). The system supports multiple user roles and includes demo user functionality for testing.

## Authentication Flow

### User Registration

1. User submits registration form with email, username, and password
2. Password is hashed using bcrypt with salt rounds
3. User account is created with default role `PLAYER`
4. JWT token is generated and returned
5. User is automatically logged in

### User Login

1. User submits email and password
2. System validates credentials against stored hash
3. JWT token is generated with user information
4. Token is returned with user profile data

### Demo Login

1. System checks for existing demo user (`demo@dnd-companion.com`)
2. If not found, creates demo user with sample data
3. Generates JWT token for demo user
4. Seeds demo campaign and character data

## JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["PLAYER"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Claims:**

- `sub`: User ID (subject)
- `email`: User email
- `roles`: Array of user roles
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (24 hours)

## Security Features

### Password Security

- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length: 6 characters
- Passwords are never stored in plain text
- Password validation includes complexity requirements

### Token Security

- JWT tokens expire after 24 hours
- Tokens are signed with HS256 algorithm
- Secret key is environment variable `JWT_SECRET`
- Tokens are validated on every protected request

### Request Security

- CORS configured for frontend origin
- Helmet middleware for security headers
- Rate limiting on authentication endpoints
- Input validation and sanitization

## Authorization

### User Roles

```typescript
enum Role {
  PLAYER = "PLAYER", // Can create and manage characters
  DM = "DM", // Can create campaigns and manage sessions
  ADMIN = "ADMIN", // Full system access
}
```

### Role Permissions

**PLAYER Role:**

- Create and manage own characters
- Join campaigns as player
- View assigned quests
- Manage personal inventory

**DM Role:**

- All PLAYER permissions
- Create and manage campaigns
- Create NPCs and locations
- Manage quests and sessions
- Use generator tools

**ADMIN Role:**

- All permissions
- Manage users
- System configuration
- Access audit logs

### Route Guards

```typescript
// JWT Authentication Guard
@UseGuards(JwtAuthGuard)

// Role-based Authorization
@Roles(Role.DM)
@UseGuards(RolesGuard)
```

## Frontend Authentication

### AuthContext

The frontend uses React Context for authentication state management:

```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

### Token Management

- JWT tokens stored in HTTP-only cookies (recommended)
- Automatic token refresh on expiration
- Token validation on app initialization
- Logout clears all stored tokens

### Protected Routes

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## API Authentication

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
```

### Authentication Middleware

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

## Demo User System

### Demo User Creation

```typescript
async demoLogin(): Promise<any> {
  let demoUser = await this.userService.findByEmail("demo@dnd-companion.com");

  if (!demoUser) {
    const createdUser = await this.userService.create({
      email: "demo@dnd-companion.com",
      username: "demo",
      password: "demo123",
      displayName: "Demo User",
      roles: [Role.PLAYER],
    });
    demoUser = await this.userService.findByEmail("demo@dnd-companion.com");
  }

  // Seed demo data
  await this.demoSeederService.seedDemoData(demoUser.id);

  // Generate token
  return this.generateToken(demoUser);
}
```

### Demo Data Seeding

The demo seeder creates:

- Sample character with full D&D 5e stats
- Demo campaign with quests
- Sample inventory items
- NPCs and locations

## Error Handling

### Authentication Errors

```typescript
// Common error responses
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid credentials"
}

{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Insufficient permissions"
}
```

### Frontend Error Handling

```typescript
// Auth context error handling
try {
  await login(credentials);
} catch (error) {
  if (error.response?.status === 401) {
    setError("Invalid email or password");
  } else {
    setError("Login failed. Please try again.");
  }
}
```

## Security Best Practices

### Password Policies

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Management

- Automatic logout on token expiration
- Secure token storage (HTTP-only cookies)
- CSRF protection
- Session invalidation on logout

### API Security

- Rate limiting (100 requests/hour for auth endpoints)
- Input validation using class-validator
- SQL injection prevention via Prisma ORM
- XSS protection via React's built-in sanitization

## Testing Authentication

### Unit Tests

```typescript
describe("AuthService", () => {
  it("should validate user credentials", async () => {
    const user = await authService.validateUser("test@example.com", "password");
    expect(user).toBeDefined();
  });

  it("should generate valid JWT token", async () => {
    const token = jwtService.sign(payload);
    expect(token).toBeDefined();
  });
});
```

### E2E Tests

```typescript
describe("Authentication (e2e)", () => {
  it("should register a new user", () => {
    return request(app.getHttpServer())
      .post("/users/register")
      .send(testUser)
      .expect(201);
  });

  it("should login successfully", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send(credentials)
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });
});
```

## Troubleshooting

### Common Issues

**"Invalid credentials" error:**

- Check email and password
- Ensure account is not locked
- Verify password requirements

**"Token expired" error:**

- Refresh the page to get new token
- Check system clock synchronization
- Verify JWT_SECRET configuration

**"Insufficient permissions" error:**

- Check user roles
- Verify route guards
- Confirm role assignments

### Debug Mode

Enable debug logging for authentication:

```bash
DEBUG=auth:* npm run dev
```

### Token Validation

Test token validity:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3002/users/profile
```

## Future Enhancements

### OAuth Integration

- Google OAuth
- Discord OAuth
- Social login options

### Multi-Factor Authentication

- TOTP (Time-based One-Time Password)
- SMS verification
- Hardware security keys

### Advanced Authorization

- Permission-based access control
- Resource-level permissions
- Dynamic role assignment

### Session Management

- Refresh token rotation
- Session invalidation
- Concurrent session limits
