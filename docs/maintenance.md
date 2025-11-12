# Maintenance Guide

This guide provides procedures and best practices for maintaining the D&D Companion application in production.

## Daily Operations

### Monitoring Health

#### Application Health Checks

```bash
# Check backend health
curl -f https://api.yourdomain.com/health

# Check frontend health
curl -f https://yourdomain.com/api/health

# Check database connectivity
docker exec dnd-postgres pg_isready -U dnd -d dnd_companion
```

#### System Resources

```bash
# Check container resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top -b -n1 | head -20
```

#### Application Logs

```bash
# View recent backend logs
docker logs --tail 100 dnd-backend

# View recent frontend logs
docker logs --tail 100 dnd-frontend

# Follow logs in real-time
docker logs -f dnd-backend

# Search logs for errors
docker logs dnd-backend 2>&1 | grep -i error
```

### Database Maintenance

#### Daily Tasks

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum tables to reclaim space
VACUUM;

-- Reindex if needed (check index usage first)
REINDEX INDEX CONCURRENTLY index_name;
```

#### Weekly Tasks

```sql
-- Full vacuum analyze
VACUUM ANALYZE;

-- Check for unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### Monthly Tasks

```bash
# Backup verification
pg_restore --list /backups/latest_backup.dump

# Test backup restoration
createdb test_restore
pg_restore -d test_restore /backups/latest_backup.dump
dropdb test_restore
```

## Performance Monitoring

### Key Metrics to Monitor

#### Application Metrics

- **Response Time**: API response times should be <500ms for 95th percentile
- **Error Rate**: Should be <1% for critical endpoints
- **Throughput**: Requests per second during peak hours
- **Memory Usage**: Should not exceed 80% of allocated memory
- **CPU Usage**: Should not exceed 70% sustained

#### Database Metrics

- **Connection Count**: Should not exceed 80% of max connections
- **Query Performance**: Identify slow queries (>1000ms)
- **Index Hit Rate**: Should be >95%
- **Cache Hit Rate**: Should be >90% for Redis

#### Infrastructure Metrics

- **Disk Usage**: Monitor for >80% usage
- **Network I/O**: Monitor for bottlenecks
- **Container Restarts**: Should be minimal (<5 per day)

### Monitoring Tools

#### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "dnd-backend"
    static_configs:
      - targets: ["backend:3002"]
    metrics_path: "/metrics"

  - job_name: "dnd-frontend"
    static_configs:
      - targets: ["frontend:3000"]
    metrics_path: "/metrics"

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres:5432"]
```

#### Grafana Dashboards

Create dashboards for:

1. **Application Performance**

   - Response times by endpoint
   - Error rates by service
   - Request throughput

2. **System Resources**

   - CPU and memory usage
   - Disk I/O and network I/O
   - Container resource usage

3. **Database Performance**

   - Query execution times
   - Connection pool usage
   - Index hit rates

4. **Business Metrics**
   - Active users
   - Character creation rate
   - Campaign activity

### Alerting Rules

```yaml
# Alert rules
groups:
  - name: dnd-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"

      - alert: SlowQueries
        expr: histogram_quantile(0.95, rate(postgres_query_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dnd_backup_$DATE.sql"

# Create backup
pg_dump -U dnd -h localhost dnd_companion > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to cloud storage
aws s3 cp "$BACKUP_FILE.gz" s3://dnd-backups/

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed - $BACKUP_FILE.gz" >> /var/log/backup.log
```

### Backup Verification

```bash
# List backup contents
pg_restore --list backup_file.dump

# Test restoration
createdb test_restore
pg_restore -d test_restore backup_file.dump --clean --if-exists
psql -d test_restore -c "SELECT COUNT(*) FROM \"User\";"
dropdb test_restore
```

### Disaster Recovery

#### Recovery Time Objectives (RTO)

- **Critical**: 1 hour (complete system down)
- **Important**: 4 hours (single service down)
- **Normal**: 24 hours (degraded performance)

#### Recovery Point Objectives (RPO)

- **Critical Data**: 1 hour (recent transactions)
- **User Data**: 24 hours (character/campaign data)
- **Logs**: 7 days (audit trails)

#### Recovery Procedures

1. **Service Failure**

   ```bash
   # Restart failed container
   docker restart dnd-backend

   # Check health
   curl -f https://api.yourdomain.com/health
   ```

2. **Database Failure**

   ```bash
   # Stop application
   docker-compose stop backend frontend

   # Restore from backup
   pg_restore -d dnd_companion /backups/latest_backup.dump

   # Restart application
   docker-compose start backend frontend
   ```

3. **Full System Recovery**

   ```bash
   # Deploy from backup infrastructure
   docker-compose -f docker-compose.backup.yml up -d

   # Restore database
   pg_restore -d dnd_companion /backups/latest_backup.dump

   # Update DNS to point to backup infrastructure
   ```

## Security Maintenance

### Regular Security Tasks

#### Weekly

```bash
# Update container images
docker-compose pull
docker-compose up -d

# Check for security vulnerabilities
npm audit
npm audit fix

# Review recent security logs
grep -i "security\|auth\|unauthorized" /var/log/dnd/*.log
```

#### Monthly

```bash
# Rotate JWT secrets
# Update .env with new JWT_SECRET
# Restart services

# Review user access patterns
# Check for suspicious activity

# Update SSL certificates
certbot renew
```

#### Quarterly

```bash
# Security audit
# Penetration testing
# Code security review
# Dependency vulnerability assessment
```

### Incident Response

#### Security Incident Procedure

1. **Detection**

   - Monitor alerts and logs
   - Check for unusual patterns

2. **Assessment**

   - Determine scope of breach
   - Identify affected systems/data

3. **Containment**

   - Isolate affected systems
   - Block malicious traffic
   - Rotate compromised credentials

4. **Recovery**

   - Restore from clean backups
   - Update security measures
   - Monitor for reoccurrence

5. **Lessons Learned**
   - Document incident
   - Update procedures
   - Implement preventive measures

## Update Procedures

### Application Updates

#### Minor Updates (Patch Versions)

```bash
# Test in staging
docker tag your-registry/dnd-backend:latest your-registry/dnd-backend:staging
kubectl set image deployment/dnd-backend-staging backend=your-registry/dnd-backend:staging

# Deploy to production
kubectl set image deployment/dnd-backend backend=your-registry/dnd-backend:latest
kubectl rollout status deployment/dnd-backend
```

#### Major Updates

```bash
# Create backup
./backup.sh

# Update staging environment
kubectl apply -f k8s/staging/

# Run integration tests
npm run test:e2e

# Blue-green deployment
kubectl apply -f k8s/production-blue/
# Wait for health checks
kubectl apply -f k8s/production-green/
# Switch traffic
kubectl apply -f k8s/ingress-green
```

### Database Updates

#### Schema Migrations

```bash
# Test migration in staging
npx prisma migrate deploy --preview

# Backup production database
./backup.sh

# Run migration
npx prisma migrate deploy

# Verify application still works
curl -f https://api.yourdomain.com/health
```

#### Data Migrations

```sql
-- Use transactions for data migrations
BEGIN;

-- Perform migration
UPDATE "Character" SET "level" = "level" + 1 WHERE "experiencePoints" >= 300;

-- Verify
SELECT COUNT(*) FROM "Character" WHERE "level" > 1;

COMMIT;
```

## Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory usage
docker stats

# Check application memory
curl https://api.yourdomain.com/metrics | grep heap

# Restart if needed
docker restart dnd-backend

# Investigate memory leaks
# Check for large objects in database
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### Slow API Responses

```sql
-- Check slow queries
SELECT
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Database Connection Issues

```bash
# Check connection pool
SELECT * FROM pg_stat_activity;

# Check max connections
SHOW max_connections;

# Restart database if needed
docker restart dnd-postgres
```

#### Container Restarts

```bash
# Check restart reason
docker logs dnd-backend | tail -50

# Check health check failures
docker inspect dnd-backend | grep -A 10 Health

# Check resource limits
docker stats dnd-backend
```

### Debug Tools

#### Application Debugging

```bash
# Enable debug logging
export DEBUG=dnd:*

# Check application configuration
curl https://api.yourdomain.com/debug/config

# Profile performance
curl https://api.yourdomain.com/debug/pprof
```

#### Database Debugging

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check locks
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Capacity Planning

### Scaling Guidelines

#### Vertical Scaling

- **CPU**: Scale up when sustained usage >70%
- **Memory**: Scale up when usage >80%
- **Storage**: Monitor growth, plan for 6 months

#### Horizontal Scaling

- **Application**: Add replicas when response times degrade
- **Database**: Use read replicas for read-heavy workloads
- **Cache**: Scale Redis when cache miss rate increases

### Resource Planning

```yaml
# Production resource allocation
backend:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

frontend:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"

database:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## Compliance and Auditing

### Audit Logging

```typescript
// Audit important actions
@Injectable()
export class AuditService {
  constructor(private logger: Logger) {}

  logAction(userId: string, action: string, resource: string, details?: any) {
    this.logger.log({
      level: "info",
      message: "Audit event",
      userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      ip: getClientIP(),
    });
  }
}
```

### Data Retention

```sql
-- Archive old data
CREATE TABLE audit_log_archive AS
SELECT * FROM audit_log
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete archived data
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '1 year';

-- Compress archives
VACUUM FULL audit_log_archive;
```

### Compliance Checks

- **GDPR**: Data export/deletion capabilities
- **Security**: Regular vulnerability scans
- **Access**: Review user permissions quarterly
- **Logs**: Retain audit logs for 7 years

## Emergency Contacts

### Support Team

- **DevOps Lead**: devops@company.com
- **Backend Lead**: backend@company.com
- **Frontend Lead**: frontend@company.com
- **Security Officer**: security@company.com

### Escalation Procedures

1. **Level 1**: On-call engineer
2. **Level 2**: Team lead (after 30 minutes)
3. **Level 3**: Management (after 2 hours)
4. **Level 4**: Executive team (after 4 hours)

### Communication Templates

**Incident Notification:**

```
Subject: [INCIDENT] D&D Companion - Service Degradation

- Service affected: [service name]
- Severity: [critical/high/medium/low]
- Start time: [timestamp]
- Current status: [investigating/mitigating/resolved]
- Impact: [description]
- ETA: [estimate]
```

**Maintenance Window:**

```
Subject: [MAINTENANCE] D&D Companion - Scheduled Maintenance

- Date/Time: [schedule]
- Duration: [expected downtime]
- Services affected: [list]
- Reason: [explanation]
- Rollback plan: [procedure]
```

This maintenance guide should be reviewed and updated quarterly to reflect changes in the system and lessons learned from incidents.
