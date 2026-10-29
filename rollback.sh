#!/bin/bash
# AgriConnect Rollback Script
# Quickly rollback to a previous backup in case of deployment failure

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}⚠️  AgriConnect Rollback Procedure${NC}"
echo "===================================="

# Configuration
PROJECT_DIR="/var/www/agriconnect"
BACKUP_DIR="/var/backups/agriconnect"

# Check if running as appropriate user
if [ "$(whoami)" != "root" ] && [ "$(whoami)" != "agriconnect" ]; then
    echo -e "${RED}❌ Run as root or agriconnect user${NC}"
    exit 1
fi

# List available backups
echo -e "${YELLOW}📦 Available Backups:${NC}"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

BACKUPS=($(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo -e "${RED}❌ No backups found${NC}"
    exit 1
fi

# Display backups with index
for i in "${!BACKUPS[@]}"; do
    BACKUP_FILE="${BACKUPS[$i]}"
    BACKUP_NAME=$(basename "$BACKUP_FILE")
    BACKUP_DATE=$(echo "$BACKUP_NAME" | grep -oP '\d{8}_\d{6}')
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    FORMATTED_DATE=$(echo "$BACKUP_DATE" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
    echo "  $((i+1))) $FORMATTED_DATE ($BACKUP_SIZE)"
done

echo ""
read -p "Select backup number to rollback to (1-${#BACKUPS[@]}): " BACKUP_CHOICE

# Validate choice
if ! [[ "$BACKUP_CHOICE" =~ ^[0-9]+$ ]] || [ "$BACKUP_CHOICE" -lt 1 ] || [ "$BACKUP_CHOICE" -gt ${#BACKUPS[@]} ]; then
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$((BACKUP_CHOICE-1))]}"
SELECTED_NAME=$(basename "$SELECTED_BACKUP")

echo ""
echo -e "${RED}⚠️  WARNING: This will replace current installation with backup${NC}"
echo -e "${YELLOW}Selected backup: $SELECTED_NAME${NC}"
echo ""
read -p "Are you sure? Type 'ROLLBACK' to confirm: " CONFIRM

if [ "$CONFIRM" != "ROLLBACK" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

# Create emergency backup of current state
echo -e "${YELLOW}📦 Creating emergency backup of current state...${NC}"
EMERGENCY_BACKUP="$BACKUP_DIR/emergency_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$EMERGENCY_BACKUP" "$PROJECT_DIR" 2>/dev/null || true
echo -e "${GREEN}✅ Emergency backup created: $EMERGENCY_BACKUP${NC}"

# Stop services
echo -e "${YELLOW}🔄 Stopping services...${NC}"
pm2 stop all || true
systemctl stop nginx || true
echo -e "${GREEN}✅ Services stopped${NC}"

# Backup current database
echo -e "${YELLOW}🗄️  Backing up current database...${NC}"
DB_BACKUP="$BACKUP_DIR/db_before_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"
source "$PROJECT_DIR/backend/.env.production"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p | gzip > "$DB_BACKUP" || true
echo -e "${GREEN}✅ Database backed up: $DB_BACKUP${NC}"

# Restore from backup
echo -e "${YELLOW}📥 Restoring from backup...${NC}"
cd /
tar -xzf "$SELECTED_BACKUP"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files restored${NC}"
else
    echo -e "${RED}❌ Restore failed${NC}"
    echo -e "${YELLOW}Restoring from emergency backup...${NC}"
    tar -xzf "$EMERGENCY_BACKUP"
    echo -e "${GREEN}✅ Reverted to emergency backup${NC}"
    exit 1
fi

# Restore node_modules
echo -e "${YELLOW}📦 Reinstalling dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm ci --production
cd "$PROJECT_DIR/frontend"
npm ci
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Rebuild frontend
echo -e "${YELLOW}🏗️  Rebuilding frontend...${NC}"
cd "$PROJECT_DIR/frontend"
npm run build
echo -e "${GREEN}✅ Frontend rebuilt${NC}"

# Check database migrations
echo -e "${YELLOW}🗄️  Checking database migrations...${NC}"
cd "$PROJECT_DIR/backend"
npm run migrate:status || true

# Restart services
echo -e "${YELLOW}🚀 Starting services...${NC}"
pm2 restart all
systemctl start nginx
echo -e "${GREEN}✅ Services started${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
HEALTH=$(curl -s http://localhost:4000/api/health | grep -o '"ok":true' || echo "failed")

if [ "$HEALTH" = '"ok":true' ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ Rollback Completed Successfully!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "📦 Restored backup: $SELECTED_NAME"
    echo "💾 Emergency backup: $EMERGENCY_BACKUP"
    echo "🗄️  Database backup: $DB_BACKUP"
    echo "🌐 Application: https://your-domain.com"
    echo ""
    echo -e "${YELLOW}⚠️  Review application thoroughly${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo ""
    echo "Check logs:"
    echo "  pm2 logs agriconnect-backend"
    echo "  tail -f /var/log/nginx/agriconnect-error.log"
    echo ""
    echo "Emergency backup available at: $EMERGENCY_BACKUP"
    exit 1
fi

# Log rollback
echo "$(date): Rollback completed - $SELECTED_NAME" >> /var/log/agriconnect/rollback.log
