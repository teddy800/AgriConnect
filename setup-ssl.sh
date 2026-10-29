#!/bin/bash
# AgriConnect SSL/HTTPS Certificate Setup Script
# Uses Let's Encrypt for free SSL certificates with auto-renewal

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔒 AgriConnect SSL Certificate Setup${NC}"
echo "======================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration - UPDATE THESE
DOMAIN="your-domain.com"
WWW_DOMAIN="www.your-domain.com"
EMAIL="admin@your-domain.com"
WEBROOT="/var/www/agriconnect"

echo -e "${YELLOW}⚠️  Make sure DNS records point to this server before continuing!${NC}"
echo "Domain: $DOMAIN"
echo "WWW Domain: $WWW_DOMAIN"
echo ""
read -p "Press Enter to continue or Ctrl+C to abort..."

# Install Certbot
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y certbot python3-certbot-nginx
else
    echo -e "${RED}❌ Unsupported package manager${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Certbot installed${NC}"

# Stop Nginx temporarily
echo -e "${YELLOW}🔄 Stopping Nginx...${NC}"
systemctl stop nginx

# Obtain SSL certificate
echo -e "${YELLOW}🔐 Obtaining SSL certificate...${NC}"
certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    systemctl start nginx
    exit 1
fi

# Configure Nginx with SSL
echo -e "${YELLOW}⚙️  Configuring Nginx with SSL...${NC}"

cat > /etc/nginx/sites-available/agriconnect-ssl.conf << 'NGINX_SSL_EOF'
# AgriConnect Nginx Configuration with SSL
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # Let's Encrypt renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;" always;
    
    # Root directory
    root /var/www/agriconnect/frontend/dist;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/agriconnect-access.log;
    error_log /var/log/nginx/agriconnect-error.log;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # API Proxy
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_conn addr 10;
    }
    
    # WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_SSL_EOF

# Update domain placeholders
sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/agriconnect-ssl.conf

# Enable site
ln -sf /etc/nginx/sites-available/agriconnect-ssl.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration invalid${NC}"
    exit 1
fi

# Start Nginx
echo -e "${YELLOW}🚀 Starting Nginx...${NC}"
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx started and enabled${NC}"

# Setup auto-renewal cron job
echo -e "${YELLOW}⏰ Setting up auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
echo -e "${GREEN}✅ Auto-renewal configured (runs daily at 3 AM)${NC}"

# Test renewal
echo -e "${YELLOW}🧪 Testing certificate renewal...${NC}"
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Renewal test successful${NC}"
else
    echo -e "${YELLOW}⚠️  Renewal test had issues (check manually)${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ SSL Setup Completed Successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "🔒 SSL Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo "🔄 Auto-renewal: Enabled (cron job)"
echo "🌐 HTTPS URL: https://$DOMAIN"
echo "📝 Nginx Config: /etc/nginx/sites-available/agriconnect-ssl.conf"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to update backend/.env.production:${NC}"
echo "   CORS_ORIGIN=https://$DOMAIN"
echo "   ENABLE_HTTPS_ONLY=true"
echo ""
