# 🚀 AgriConnect Production Deployment Guide

Complete guide for deploying AgriConnect to production with best practices and security measures.

## 📋 Pre-Deployment Checklist

### Required Actions
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL/TLS certificates obtained
- [ ] Domain DNS configured
- [ ] Database backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] API documentation reviewed
- [ ] Test coverage ≥ 70%

### Security Checklist
- [ ] JWT_SECRET changed to strong random value (min 64 characters)
- [ ] Database password changed from default
- [ ] CORS_ORIGIN set to production URL
- [ ] NODE_ENV=production
- [ ] Helmet security headers enabled
- [ ] Rate limiting configured
- [ ] Input sanitization verified
- [ ] SQL injection protection tested
- [ ] XSS protection verified

---

## 🔧 Environment Configuration

### Backend .env (Production)

```env
# Server Configuration
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database Configuration
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=agriconnect_prod
DB_USER=agriconnect_user
DB_PASSWORD=<STRONG_PASSWORD_HERE>
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=20

# JWT Authentication
JWT_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://agriconnect.et

# Advanced Features
WEBSOCKET_ENABLED=true
REDIS_ENABLED=true
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=https://your-es-host.com:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=<ES_PASSWORD>

# File Upload
MAX_FILE_SIZE=2097152
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### Frontend .env (Production)

```env
VITE_API_URL=https://api.agriconnect.et
VITE_WS_URL=https://api.agriconnect.et
```

---

## 🗄️ Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres -h your-db-host.com

# Create database
CREATE DATABASE agriconnect_prod;

# Create dedicated user
CREATE USER agriconnect_user WITH ENCRYPTED PASSWORD 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agriconnect_prod TO agriconnect_user;
```

### 2. Run Migrations

```bash
cd backend

# Install dependencies
npm ci --production=false

# Run migrations
NODE_ENV=production npm run db:migrate

# Verify migration status
npm run db:migrate:status
```

### 3. Seed Reference Data

```bash
# Seed crops, regions, markets
psql -U agriconnect_user -h your-db-host.com -d agriconnect_prod -f db/seed.sql

# Optional: Seed market prices
psql -U agriconnect_user -h your-db-host.com -d agriconnect_prod -f db/seed2.sql
```

---

## 🐳 Docker Deployment (Recommended)

### 1. Build Images

```bash
# Build backend image
cd backend
docker build -t agriconnect-backend:latest .

# Build frontend image
cd ../frontend
docker build -t agriconnect-frontend:latest .
```

### 2. Push to Registry

```bash
# Tag images
docker tag agriconnect-backend:latest registry.example.com/agriconnect-backend:latest
docker tag agriconnect-frontend:latest registry.example.com/agriconnect-frontend:latest

# Push to registry
docker push registry.example.com/agriconnect-backend:latest
docker push registry.example.com/agriconnect-frontend:latest
```

### 3. Deploy with Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: registry.example.com/agriconnect-backend:latest
    restart: always
    environment:
      NODE_ENV: production
      DB_HOST: ${DB_HOST}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: redis
      ELASTICSEARCH_URL: http://elasticsearch:9200
    ports:
      - "4000:4000"
    depends_on:
      - redis
      - elasticsearch
    networks:
      - agriconnect-network
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs

  frontend:
    image: registry.example.com/agriconnect-frontend:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - agriconnect-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - agriconnect-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    restart: always
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=${ES_PASSWORD}
    volumes:
      - es_data:/usr/share/elasticsearch/data
    networks:
      - agriconnect-network

volumes:
  uploads:
  logs:
  redis_data:
  es_data:

networks:
  agriconnect-network:
    driver: bridge
```

---

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d agriconnect.et -d www.agriconnect.et -d api.agriconnect.et

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/agriconnect
server {
    listen 80;
    server_name agriconnect.et www.agriconnect.et;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name agriconnect.et www.agriconnect.et;

    ssl_certificate /etc/letsencrypt/live/agriconnect.et/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agriconnect.et/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/agriconnect;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## 📊 Monitoring & Logging

### Application Logs

```bash
# Backend logs location
/var/log/agriconnect/app.log
/var/log/agriconnect/error.log
/var/log/agriconnect/http.log

# View logs
tail -f /var/log/agriconnect/app.log

# Search for errors
grep ERROR /var/log/agriconnect/error.log
```

### Health Check Monitoring

```bash
# Setup health check cron job
*/5 * * * * curl -f http://localhost:4000/api/health || echo "API is down!"

# Monitor with uptime tools
# - UptimeRobot
# - Pingdom
# - Datadog
```

### Performance Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name agriconnect-api

# Monitor
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

---

## 🔄 Database Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-agriconnect-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/agriconnect"
DB_NAME="agriconnect_prod"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U agriconnect_user -h localhost $DB_NAME | gzip > $BACKUP_DIR/agriconnect_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: agriconnect_$DATE.sql.gz"
```

### Cron Job Setup

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-agriconnect-db.sh >> /var/log/agriconnect-backup.log 2>&1
```

---

## 🚦 Performance Optimization

### Database Optimization

```sql
-- Analyze tables for optimal query planning
ANALYZE;

-- Vacuum to reclaim storage
VACUUM ANALYZE;

-- Create additional indexes if needed
CREATE INDEX CONCURRENTLY idx_listings_created_price 
ON listings(created_at DESC, price_per_unit);
```

### Redis Configuration

```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Elasticsearch Optimization

```bash
# Increase heap size
export ES_JAVA_OPTS="-Xms2g -Xmx2g"

# Disable swapping
sudo swapoff -a
```

---

## 🧪 Post-Deployment Testing

### 1. Health Checks

```bash
# API Health
curl https://api.agriconnect.et/api/health

# Monitoring Health
curl https://api.agriconnect.et/api/monitoring/health
```

### 2. Functional Testing

```bash
# Test authentication
curl -X POST https://api.agriconnect.et/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0911111111","password":"test123"}'

# Test listings
curl https://api.agriconnect.et/api/listings

# Test search
curl https://api.agriconnect.et/api/search?q=teff
```

### 3. Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 50 https://api.agriconnect.et/api/health

# Or use k6
k6 run load-test.js
```

---

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Deny direct database access from internet
sudo ufw deny 5432/tcp
```

### Fail2Ban Setup

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure for SSH and Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Restart
sudo systemctl restart fail2ban
```

---

## 📱 Monitoring Endpoints

### Available Endpoints

- **Health Check**: `GET /api/health`
- **Monitoring**: `GET /api/monitoring/health`
- **Metrics**: `GET /api/monitoring/metrics`
- **API Version**: `GET /api/version`
- **Documentation**: `GET /api/docs`

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U agriconnect_user -h localhost -d agriconnect_prod
```

**Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

**High Memory Usage**
```bash
# Check memory
free -h

# Check Node processes
pm2 list
pm2 logs --lines 100
```

---

## 📞 Support Contacts

- **Technical Lead**: tech@agriconnect.et
- **DevOps**: devops@agriconnect.et
- **Security**: security@agriconnect.et

---

## 🎉 Deployment Complete!

Your AgriConnect platform is now live and ready to serve Ethiopian farmers and buyers!

**Next Steps:**
1. Monitor logs for first 24 hours
2. Set up alerts for critical errors
3. Run daily health checks
4. Review performance metrics weekly
5. Plan regular security audits

**Remember to:**
- Keep dependencies updated
- Monitor disk space
- Review access logs
- Backup regularly
- Test disaster recovery

---

*Last Updated: October 18, 2026*
*Version: 1.0.0*
