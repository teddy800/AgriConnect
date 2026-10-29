#!/bin/bash
# AgriConnect Database Backup Script
# Automatically backs up PostgreSQL database with compression and S3 upload

set -e

# Load environment variables
source /var/www/agriconnect/backend/.env.production

# Configuration
BACKUP_DIR="/var/backups/agriconnect/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="agriconnect_backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🗄️  AgriConnect Database Backup Starting...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# Dump database
echo -e "${YELLOW}📦 Creating database dump...${NC}"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database dumped successfully${NC}"
else
    echo -e "${RED}❌ Database dump failed${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup compressed: $COMPRESSED_FILE${NC}"

# Get file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo -e "${GREEN}📊 Backup size: $FILE_SIZE${NC}"

# Upload to S3 (if enabled)
if [ "$BACKUP_S3_BUCKET" != "" ]; then
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    aws s3 cp "$COMPRESSED_FILE" "s3://$BACKUP_S3_BUCKET/database/$COMPRESSED_FILE" \
        --storage-class STANDARD_IA \
        --metadata "created=$(date -Iseconds),database=$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Uploaded to S3${NC}"
    else
        echo -e "${YELLOW}⚠️  S3 upload failed (backup saved locally)${NC}"
    fi
fi

# Clean up old backups
echo -e "${YELLOW}🗑️  Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "agriconnect_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
CLEANED=$(find "$BACKUP_DIR" -name "agriconnect_backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}✅ Keeping last $CLEANED backups (${RETENTION_DAYS} days retention)${NC}"

# Log backup
echo "$(date): Backup completed - $COMPRESSED_FILE ($FILE_SIZE)" >> /var/log/agriconnect/backup.log

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo "📁 Location: $BACKUP_DIR/$COMPRESSED_FILE"
echo "📊 Size: $FILE_SIZE"
echo "🗓️  Retention: $RETENTION_DAYS days"
if [ "$BACKUP_S3_BUCKET" != "" ]; then
    echo "☁️  S3: s3://$BACKUP_S3_BUCKET/database/$COMPRESSED_FILE"
fi
