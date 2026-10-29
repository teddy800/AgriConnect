#!/bin/bash
# AgriConnect Monitoring Setup Script
# Integrates Sentry for error tracking and monitoring

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📊 AgriConnect Monitoring Setup${NC}"
echo "=================================="

# Configuration
PROJECT_DIR="/var/www/agriconnect"
ENV_FILE="$PROJECT_DIR/backend/.env.production"

echo -e "${YELLOW}📝 Sentry Integration Instructions:${NC}"
echo ""
echo "1. Create Sentry account at https://sentry.io"
echo "2. Create a new project (Node.js for backend, React for frontend)"
echo "3. Copy the DSN (Data Source Name) from project settings"
echo ""
read -p "Enter your Sentry DSN: " SENTRY_DSN

if [ -z "$SENTRY_DSN" ]; then
    echo -e "${RED}❌ Sentry DSN is required${NC}"
    exit 1
fi

# Install Sentry SDK for Backend
echo -e "${YELLOW}📦 Installing Sentry SDK for backend...${NC}"
cd "$PROJECT_DIR/backend"
npm install @sentry/node @sentry/profiling-node --save
echo -e "${GREEN}✅ Backend Sentry SDK installed${NC}"

# Install Sentry SDK for Frontend
echo -e "${YELLOW}📦 Installing Sentry SDK for frontend...${NC}"
cd "$PROJECT_DIR/frontend"
npm install @sentry/react @sentry/browser --save
echo -e "${GREEN}✅ Frontend Sentry SDK installed${NC}"

# Update backend .env
echo -e "${YELLOW}⚙️  Updating backend environment variables...${NC}"
if grep -q "SENTRY_DSN=" "$ENV_FILE"; then
    sed -i "s|SENTRY_DSN=.*|SENTRY_DSN=$SENTRY_DSN|" "$ENV_FILE"
else
    echo "SENTRY_DSN=$SENTRY_DSN" >> "$ENV_FILE"
fi

sed -i "s/SENTRY_ENABLED=.*/SENTRY_ENABLED=true/" "$ENV_FILE"
echo -e "${GREEN}✅ Backend environment updated${NC}"

# Create Sentry initialization for backend
echo -e "${YELLOW}📝 Creating backend Sentry configuration...${NC}"
cat > "$PROJECT_DIR/backend/src/sentry.js" << 'EOF'
/**
 * Sentry Error Tracking Configuration
 * Monitors and reports errors in production
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = (app) => {
  if (process.env.SENTRY_ENABLED === 'true' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
      ],
      tracesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
      profilesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
      ignoreErrors: [
        'ECONNRESET',
        'EPIPE',
        'ETIMEDOUT',
        'NetworkError',
        'Non-Error promise rejection',
      ],
    });

    console.log('✅ Sentry error tracking initialized');
  } else {
    console.log('⚠️  Sentry is disabled');
  }
};

const captureException = (error, context = {}) => {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.captureException(error, { extra: context });
  }
  console.error('Error:', error);
};

const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.captureMessage(message, { level, extra: context });
  }
  console.log(`[${level.toUpperCase()}] ${message}`);
};

module.exports = {
  Sentry,
  initSentry,
  captureException,
  captureMessage,
};
EOF
echo -e "${GREEN}✅ Backend Sentry configuration created${NC}"

# Create Sentry initialization for frontend
echo -e "${YELLOW}📝 Creating frontend Sentry configuration...${NC}"
cat > "$PROJECT_DIR/frontend/src/sentry.js" << 'EOF'
/**
 * Sentry Error Tracking Configuration - Frontend
 * Monitors and reports client-side errors
 */

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const SENTRY_ENABLED = import.meta.env.VITE_SENTRY_ENABLED === 'true';

  if (SENTRY_ENABLED && SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^\//,
            /^https:\/\/your-domain\.com/,
          ],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }
        return event;
      },
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection',
        'Network request failed',
        'Failed to fetch',
      ],
    });

    console.log('✅ Sentry initialized (frontend)');
  }
};

export const captureException = (error, context = {}) => {
  console.error('Error:', error);
  if (import.meta.env.VITE_SENTRY_ENABLED === 'true') {
    Sentry.captureException(error, { extra: context });
  }
};

export const captureMessage = (message, level = 'info', context = {}) => {
  console.log(`[${level.toUpperCase()}] ${message}`);
  if (import.meta.env.VITE_SENTRY_ENABLED === 'true') {
    Sentry.captureMessage(message, { level, extra: context });
  }
};

export { Sentry };
EOF
echo -e "${GREEN}✅ Frontend Sentry configuration created${NC}"

# Create frontend .env.production
echo -e "${YELLOW}📝 Creating frontend .env.production...${NC}"
cat > "$PROJECT_DIR/frontend/.env.production" << ENV_EOF
# AgriConnect Frontend - Production Environment
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=wss://your-domain.com
VITE_SENTRY_ENABLED=true
VITE_SENTRY_DSN=$SENTRY_DSN
VITE_CDN_URL=https://cdn.your-domain.com
ENV_EOF
echo -e "${GREEN}✅ Frontend environment created${NC}"

# Create health monitoring script
echo -e "${YELLOW}📝 Creating health monitoring script...${NC}"
cat > "$PROJECT_DIR/health-monitor.sh" << 'HEALTH_EOF'
#!/bin/bash
# Health Monitoring Script - Checks application health every minute

HEALTH_URL="http://localhost:4000/api/health"
LOG_FILE="/var/log/agriconnect/health-monitor.log"

# Check backend health
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" -eq 200 ]; then
    echo "$(date): ✅ Backend healthy (HTTP $RESPONSE)" >> "$LOG_FILE"
else
    echo "$(date): ❌ Backend unhealthy (HTTP $RESPONSE)" >> "$LOG_FILE"
    
    # Alert via Sentry
    curl -s -X POST "https://sentry.io/api/0/projects/YOUR_ORG/YOUR_PROJECT/events/" \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"Backend health check failed - HTTP $RESPONSE\"}"
    
    # Restart if critical
    if [ "$RESPONSE" -eq 000 ] || [ "$RESPONSE" -eq 500 ]; then
        echo "$(date): 🔄 Restarting backend..." >> "$LOG_FILE"
        pm2 restart agriconnect-backend
    fi
fi

# Cleanup old logs (keep last 30 days)
find /var/log/agriconnect -name "health-monitor-*.log" -mtime +30 -delete
HEALTH_EOF

chmod +x "$PROJECT_DIR/health-monitor.sh"
echo -e "${GREEN}✅ Health monitoring script created${NC}"

# Setup health monitoring cron
echo -e "${YELLOW}⏰ Setting up health monitoring cron...${NC}"
(crontab -l 2>/dev/null; echo "* * * * * $PROJECT_DIR/health-monitor.sh") | crontab -
echo -e "${GREEN}✅ Health monitoring cron configured (runs every minute)${NC}"

# Create performance monitoring dashboard
echo -e "${YELLOW}📝 Creating performance monitoring info...${NC}"
cat > "$PROJECT_DIR/MONITORING.md" << 'MONITOR_EOF'
# AgriConnect Monitoring Guide

## Sentry Dashboard
Access your Sentry dashboard at: https://sentry.io

### Key Metrics to Monitor:
- **Error Rate**: Should be < 1%
- **Response Time**: Should be < 500ms average
- **Apdex Score**: Should be > 0.9
- **Crash-Free Rate**: Should be > 99.5%

## Health Checks
- Backend Health: `curl http://localhost:4000/api/health`
- Database Health: Check PostgreSQL logs
- Redis Health: `redis-cli ping`
- Elasticsearch Health: `curl http://localhost:9200/_cluster/health`

## Log Locations
- Backend Logs: `/var/log/agriconnect/backend-*.log`
- Nginx Logs: `/var/log/nginx/agriconnect-*.log`
- PM2 Logs: `pm2 logs agriconnect-backend`
- Health Monitor: `/var/log/agriconnect/health-monitor.log`

## PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs agriconnect-backend

# Restart
pm2 restart agriconnect-backend

# Monitor resources
pm2 monit

# View metrics
pm2 metrics
```

## Alert Setup
Configure Sentry alerts for:
1. Error rate > 1% (15 min window)
2. Response time > 1s (15 min window)
3. Memory usage > 80%
4. Crash rate > 0.1%

## Performance Optimization
- Enable Redis caching: `REDIS_ENABLED=true`
- Enable Elasticsearch: `ELASTICSEARCH_ENABLED=true`
- Monitor database query times
- Review slow API endpoints
- Optimize database indexes

## Backup Verification
- Daily database backups run at 2 AM
- Verify latest backup: `ls -lh /var/backups/agriconnect/database/`
- Test restore procedure monthly
MONITOR_EOF
echo -e "${GREEN}✅ Monitoring documentation created${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Monitoring Setup Completed!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📊 Sentry Dashboard: https://sentry.io"
echo "📝 Backend Config: $PROJECT_DIR/backend/src/sentry.js"
echo "📝 Frontend Config: $PROJECT_DIR/frontend/src/sentry.js"
echo "🏥 Health Monitor: $PROJECT_DIR/health-monitor.sh (runs every minute)"
echo "📚 Documentation: $PROJECT_DIR/MONITORING.md"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Update server.js to initialize Sentry"
echo "2. Update frontend main.jsx to initialize Sentry"
echo "3. Rebuild frontend: cd frontend && npm run build"
echo "4. Restart services: pm2 restart all"
echo "5. Visit Sentry dashboard to verify integration"
echo ""
