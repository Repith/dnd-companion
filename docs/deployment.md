# Deployment Guide

This guide covers deploying the D&D Companion application to production environments.

## Deployment Overview

The application supports multiple deployment strategies:

- **Docker Containers**: Recommended for consistency
- **Kubernetes**: For scalable, cloud-native deployments
- **Traditional Hosting**: For simpler setups
- **Serverless**: For specific components

## Prerequisites

### Infrastructure Requirements

- **Domain Name**: Configure DNS for your application
- **SSL Certificate**: HTTPS required for production
- **Database**: PostgreSQL 15+ instance
- **Reverse Proxy**: Nginx or similar for load balancing
- **Monitoring**: Logging and metrics collection

### Environment Variables

Production environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="strong-random-secret-key-32-chars-minimum"

# Frontend
FRONTEND_URL="https://yourdomain.com"

# Server
PORT=3002
NODE_ENV="production"

# Security
CORS_ORIGIN="https://yourdomain.com"

# Optional: External Services
REDIS_URL="redis://host:6379"
SENTRY_DSN="your-sentry-dsn"
```

## Docker Deployment

### Production Docker Compose

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  backend:
    image: your-registry/dnd-backend:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - REDIS_URL=${REDIS_URL}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3002:3002"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    image: your-registry/dnd-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    upstream backend {
        server backend:3002;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/ssl/certs/yourdomain.crt;
        ssl_certificate_key /etc/ssl/certs/yourdomain.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Rate limiting for API
            limit_req zone=api burst=20 nodelay;
        }

        # Auth endpoints - stricter rate limiting
        location ~ ^/api/(auth|users/register) {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            limit_req zone=auth burst=5 nodelay;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## Kubernetes Deployment

### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dnd-backend
  labels:
    app: dnd-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dnd-backend
  template:
    metadata:
      labels:
        app: dnd-backend
    spec:
      containers:
        - name: backend
          image: your-registry/dnd-backend:latest
          ports:
            - containerPort: 3002
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: dnd-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: dnd-secrets
                  key: jwt-secret
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3002
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3002
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dnd-frontend
  labels:
    app: dnd-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dnd-frontend
  template:
    metadata:
      labels:
        app: dnd-frontend
    spec:
      containers:
        - name: frontend
          image: your-registry/dnd-frontend:latest
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_API_URL
              value: "https://api.yourdomain.com"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Services and Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dnd-backend-service
spec:
  selector:
    app: dnd-backend
  ports:
    - port: 3002
      targetPort: 3002
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: dnd-frontend-service
spec:
  selector:
    app: dnd-frontend
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dnd-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - yourdomain.com
        - api.yourdomain.com
      secretName: dnd-tls
  rules:
    - host: yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dnd-frontend-service
                port:
                  number: 3000
    - host: api.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dnd-backend-service
                port:
                  number: 3002
```

## Database Setup

### Production PostgreSQL

```sql
-- Create production database
CREATE DATABASE dnd_companion_production;

-- Create application user
CREATE USER dnd_app WITH ENCRYPTED PASSWORD 'strong-password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE dnd_companion_production TO dnd_app;

-- Connect to database and set up schema
\c dnd_companion_production;

-- Run Prisma migrations
-- This will be done automatically during deployment
```

### Database Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dnd_backup_$DATE.sql"

# Create backup
pg_dump -U dnd_app -h localhost dnd_companion_production > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "dnd_backup_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_FILE.gz" s3://your-backup-bucket/
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build backend
        run: cd apps/backend && npm run build

      - name: Build frontend
        run: cd apps/frontend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment commands here
```

### Docker Build and Push

```yaml
name: Build and Push Docker Images
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.backend
          push: true
          tags: your-registry/dnd-backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.frontend
          push: true
          tags: your-registry/dnd-frontend:latest
```

## Monitoring and Observability

### Health Checks

```typescript
// Backend health check endpoint
@Get('health')
getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  };
}
```

### Logging

```typescript
// Winston logger configuration
import * as winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "dnd-backend" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// In production, also log to external service
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Http({
      host: "log-aggregator.example.com",
      path: "/logs",
    }),
  );
}
```

### Metrics

```typescript
// Prometheus metrics
import { collectDefaultMetrics, register } from "prom-client";

collectDefaultMetrics();

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## Security Considerations

### SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Security Headers

```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Database Security

```sql
-- Create read-only user for analytics
CREATE USER dnd_readonly WITH ENCRYPTED PASSWORD 'readonly-password';
GRANT CONNECT ON DATABASE dnd_companion_production TO dnd_readonly;
GRANT USAGE ON SCHEMA public TO dnd_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dnd_readonly;

-- Row Level Security (if needed)
ALTER TABLE "Character" ENABLE ROW LEVEL SECURITY;
CREATE POLICY character_owner_policy ON "Character"
  FOR ALL USING (owner_id = current_user_id());
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_character_owner ON "Character"(owner_id);
CREATE INDEX CONCURRENTLY idx_character_campaign ON "Character"(campaign_id);
CREATE INDEX CONCURRENTLY idx_game_event_session ON "GameEvent"(session_id, timestamp);

-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM "Character" WHERE owner_id = $1;

-- Partition large tables (if needed)
CREATE TABLE game_events_2024 PARTITION OF "GameEvent"
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, data);
    } else {
      await redis.set(key, data);
    }
  }
}
```

### CDN Configuration

```nginx
# Static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
}
```

## Scaling Strategies

### Horizontal Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dnd-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dnd-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Database Scaling

```sql
-- Read replicas for read-heavy operations
-- Connection pooling with PgBouncer
-- Database sharding (if user base grows significantly)
```

## Rollback Strategy

### Blue-Green Deployment

```bash
# Deploy new version
kubectl set image deployment/dnd-backend backend=your-registry/dnd-backend:v2

# Verify health
kubectl rollout status deployment/dnd-backend

# Switch traffic (if using service mesh)
kubectl apply -f new-service.yaml

# Rollback if needed
kubectl rollout undo deployment/dnd-backend
```

### Database Migrations

```bash
# Safe migration with rollback
# Always test migrations on staging first
# Keep migration scripts idempotent
# Use transaction for complex migrations
```

## Maintenance Procedures

### Regular Tasks

```bash
# Database maintenance
VACUUM ANALYZE;

# Update dependencies
npm audit fix

# Rotate logs
logrotate /etc/logrotate.d/dnd-app

# Backup verification
pg_restore --list backup_file.dump
```

### Emergency Procedures

1. **Service Down**: Check logs, restart containers, failover to backup
2. **Database Issues**: Restore from backup, check disk space, connection pool
3. **Security Incident**: Rotate secrets, audit logs, notify users
4. **Performance Degradation**: Scale resources, optimize queries, check cache

## Cost Optimization

### Resource Optimization

```yaml
# Right-size containers
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Database Optimization

- Use appropriate instance sizes
- Implement connection pooling
- Archive old data
- Use read replicas for analytics

### CDN and Caching

- Cache static assets
- Use CDN for global distribution
- Implement API response caching
- Compress responses

## Compliance and Legal

### Data Protection

- GDPR compliance for EU users
- Data encryption at rest and in transit
- Regular security audits
- User data export/deletion capabilities

### Backup and Recovery

- Daily automated backups
- Cross-region backup storage
- Regular recovery testing
- 30-day retention policy

This deployment guide provides a comprehensive foundation for production deployment. Adjust configurations based on your specific infrastructure and requirements.
