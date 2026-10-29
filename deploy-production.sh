#!/bin/bash
# AgriConnect Production Deployment Script
# This script automates the production deployment process

set -e

echo "🌾 AgriConnect Production Deployment Starting..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/var/www/agriconnect"
BACKUP_DIR="/var/backups/agriconnect"
LOG_FILE="/var/log/agriconnect/deploy.log"

# Create backup
echo -e "${YELLOW}📦 Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" "$PROJECT_DIR" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created${NC}"

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
cd "$PROJECT_DIR"
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"

# Install dependencies
echo -e "${YELLOW}📚 Installing backend dependencies...${NC}"
cd backend
npm ci --production
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo -e "${YELLOW}📚 Installing frontend dependencies...${NC}"
cd ../frontend
npm ci
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
cd ../backend
npm run migrate:latest
echo -e "${GREEN}✅ Migrations completed${NC}"

# Restart services
echo -e "${YELLOW}🔄 Restarting services...${NC}"
pm2 restart agriconnect-backend
pm2 restart agriconnect-frontend
echo -e "${GREEN}✅ Services restarted${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
HEALTH=$(curl -s http://localhost:4000/api/health | grep -o '"ok":true' || echo "failed")
if [ "$HEALTH" = '"ok":true' ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed - Rolling back...${NC}"
    tar -xzf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C /
    pm2 restart all
    exit 1
fi

# Clear cache
echo -e "${YELLOW}🗑️  Clearing cache...${NC}"
pm2 flush
echo -e "${GREEN}✅ Cache cleared${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📊 Deployment Log: $LOG_FILE"
echo "💾 Backup Location: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
echo "🌐 Application URL: https://your-domain.com"
echo ""

# Log deployment
echo "$(date): Deployment completed successfully" >> "$LOG_FILE"
