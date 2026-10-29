# AgriConnect Production Deployment Checklist

## ⚠️ CRITICAL - BEFORE PRODUCTION

### 1. Security Configuration
- [ ] **Change admin password** from `password123` to a strong password
  ```bash
  cd backend
  node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NEW_STRONG_PASSWORD', 10));"
  # Update in database: UPDATE users SET password_hash = 'NEW_HASH' WHERE role = 'admin';
  ```

- [ ] **Generate new JWT_SECRET**
  ```bash
  openssl rand -base64 64
  # Update in backend/.env.production
  ```

- [ ] **Update CORS origins**
  ```
  Edit backend/.env.production:
  CORS_ORIGIN=https://your-actual-domain.com
  ```

- [ ] **Configure production database**
  ```
  Update in backend/.env.production:
  - DB_HOST=your-production-db-host
  - DB_NAME=agriconnect_prod
  - DB_USER=agriconnect_user
  - DB_PASSWORD=STRONG_PASSWORD_HERE
  - DB_SSL=true
  ```

### 2. SSL/HTTPS Setup
- [ ] **Verify DNS records** point to your server
- [ ] **Run SSL setup script**
  ```bash
  sudo chmod +x setup-ssl.sh
  sudo ./setup-ssl.sh
  ```
- [ ] **Enable HTTPS-only mode**
  ```
  backend/.env.production:
  ENABLE_HTTPS_ONLY=true
  NODE_ENV=production
  ```

### 3. Environment Variables
- [ ] **Review all environment variables** in `backend/.env.production`
- [ ] **Update all "CHANGE_THIS" placeholders**
- [ ] **Remove or secure .env files** (dev/test)
  ```bash
  chmod 600 backend/.env.production
  ```

### 4. Rate Limiting & Security
- [ ] **Review rate limits** for production traffic
  ```
  backend/.env.production:
  RATE_LIMIT_WINDOW_MS=900000  (15 minutes)
  RATE_LIMIT_MAX_REQUESTS=100
  ```
- [ ] **Enable security headers** (already configured in Nginx)
- [ ] **Configure trusted proxies** if using load balancer

### 5. Monitoring & Error Tracking
- [ ] **Set up Sentry** for error tracking
  ```bash
  chmod +x setup-monitoring.sh
  ./setup-monitoring.sh
  ```
- [ ] **Configure alerts** in Sentry dashboard
- [ ] **Test health monitoring**
  ```bash
  curl http://localhost:4000/api/health
  ```

### 6. Backup Strategy
- [ ] **Configure database backups**
  ```bash
  chmod +x backend/scripts/backup-database.sh
  # Add to crontab: 0 2 * * * /path/to/backup-database.sh
  ```
- [ ] **Set up S3 bucket** for backup storage
- [ ] **Test backup restoration** procedure
- [ ] **Configure backup retention** (default: 30 days)

### 7. CI/CD Pipeline
- [ ] **Review GitHub Actions** workflows in `.github/workflows/`
- [ ] **Add GitHub secrets**:
  - `SERVER_HOST`
  - `SERVER_USER`
  - `SSH_PRIVATE_KEY`
  - `SENTRY_AUTH_TOKEN`
- [ ] **Test deployment pipeline** with staging branch

### 8. Database Setup
- [ ] **Run migrations** on production database
  ```bash
  cd backend
  npm run migrate:latest
  ```
- [ ] **Verify database indexes** are created
- [ ] **Check database connection pooling**
- [ ] **Enable query logging** (temporarily for monitoring)

### 9. Frontend Build
- [ ] **Update API URL** in `frontend/.env.production`
  ```
  VITE_API_URL=https://your-domain.com/api
  VITE_WS_URL=wss://your-domain.com
  ```
- [ ] **Build production bundle**
  ```bash
  cd frontend
  npm run build
  ```
- [ ] **Verify bundle size** (should be ~835KB total, ~190KB gzipped)
- [ ] **Test production build** locally

### 10. Process Management (PM2)
- [ ] **Review PM2 configuration** in `ecosystem.config.js`
- [ ] **Update deployment settings** (server IP, repo URL)
- [ ] **Install PM2 globally**
  ```bash
  npm install -g pm2
  ```
- [ ] **Start application**
  ```bash
  pm2 start ecosystem.config.js --env production
  pm2 save
  pm2 startup
  ```

---

## 🔄 OPTIONAL ENHANCEMENTS

### Advanced Performance
- [ ] **Enable Redis caching**
  ```
  backend/.env.production:
  REDIS_ENABLED=true
  REDIS_HOST=your-redis-host
  REDIS_PASSWORD=your-redis-password
  ```
- [ ] **Enable Elasticsearch** for advanced search
  ```
  backend/.env.production:
  ELASTICSEARCH_ENABLED=true
  ELASTICSEARCH_URL=https://your-es-host:9200
  ```
- [ ] **Configure CDN** for static assets
  ```
  backend/.env.production:
  CDN_ENABLED=true
  CDN_URL=https://cdn.your-domain.com
  ```

### Email & SMS Services
- [ ] **Configure email service** (SendGrid/AWS SES)
  ```bash
  chmod +x setup-email.sh
  ./setup-email.sh
  ```
- [ ] **Set up SMS service** (Twilio/Africa's Talking)
  ```bash
  chmod +x setup-sms.sh
  ./setup-sms.sh
  ```
- [ ] **Test email/SMS delivery**

### Payment Integration (if needed)
- [ ] **Integrate payment gateway** (Stripe, Chapa, etc.)
- [ ] **Configure webhook endpoints**
- [ ] **Test payment flow** in sandbox
- [ ] **Enable in production**
  ```
  backend/.env.production:
  PAYMENT_ENABLED=true
  STRIPE_SECRET_KEY=sk_live_YOUR_KEY
  ```

### Additional Services
- [ ] **Set up Telegram bot** (optional)
  ```
  backend/.env.production:
  ENABLE_TELEGRAM_BOT=true
  ```
- [ ] **Configure AWS S3** for file uploads
  ```
  backend/.env.production:
  S3_ENABLED=true
  AWS_S3_BUCKET=agriconnect-uploads
  ```
- [ ] **Enable WebSocket** notifications
  ```
  backend/.env.production:
  WEBSOCKET_ENABLED=true
  ```

---

## 🚀 DEPLOYMENT STEPS

### Option 1: Automated Deployment Script
```bash
# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

### Option 2: Manual Deployment
```bash
# 1. Pull latest code
cd /var/www/agriconnect
git pull origin main

# 2. Install dependencies
cd backend && npm ci --production
cd ../frontend && npm ci

# 3. Build frontend
cd frontend && npm run build

# 4. Run migrations
cd ../backend && npm run migrate:latest

# 5. Restart services
pm2 restart all

# 6. Health check
curl http://localhost:4000/api/health
```

### Option 3: PM2 Deploy
```bash
# From local machine
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Health Checks
- [ ] **Backend API** responds: `https://your-domain.com/api/health`
- [ ] **Frontend** loads: `https://your-domain.com`
- [ ] **Database** connection verified
- [ ] **WebSocket** connection working
- [ ] **SSL certificate** valid and auto-renewing

### Functional Tests
- [ ] **User registration** works (phone/email)
- [ ] **Login** works (both methods)
- [ ] **Admin dashboard** accessible
- [ ] **Marketplace listings** display correctly
- [ ] **Price data** loads
- [ ] **Weather forecast** works
- [ ] **File uploads** work
- [ ] **Search functionality** works

### Performance Tests
- [ ] **Page load time** < 3 seconds
- [ ] **API response time** < 500ms average
- [ ] **Lighthouse score** > 90
- [ ] **No console errors** in browser
- [ ] **Memory usage** stable over time

### Security Tests
- [ ] **HTTPS** redirects working
- [ ] **Security headers** present
- [ ] **Rate limiting** enforced
- [ ] **CORS** properly configured
- [ ] **SQL injection** protected
- [ ] **XSS** protected
- [ ] **CSRF** protected

### Monitoring
- [ ] **Sentry** receiving events
- [ ] **PM2 monitoring** active: `pm2 monit`
- [ ] **Log files** writing correctly
- [ ] **Health monitor** cron running
- [ ] **Backup cron** scheduled

---

## 🔥 ROLLBACK PROCEDURE

If deployment fails:

```bash
# Quick rollback
chmod +x rollback.sh
./rollback.sh

# Select backup to restore
# Services will be automatically restarted
```

---

## 📊 MONITORING DASHBOARD ACCESS

- **Application**: https://your-domain.com
- **Sentry**: https://sentry.io
- **PM2 Web**: `pm2 web` (optional)
- **Server Logs**: `/var/log/agriconnect/`
- **Nginx Logs**: `/var/log/nginx/`

---

## 📞 EMERGENCY CONTACTS

- **System Admin**: [Your contact]
- **Database Admin**: [Your contact]
- **DevOps**: [Your contact]

---

## 📚 DOCUMENTATION

- **API Documentation**: `/api-docs` (Swagger)
- **Monitoring Guide**: `MONITORING.md`
- **Deployment Scripts**: Root directory (`*.sh`)
- **Environment Config**: `backend/.env.production`

---

## 🎯 PERFORMANCE TARGETS

- **Uptime**: 99.9%
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **Apdex Score**: > 0.9
- **Page Load**: < 3 seconds
- **Lighthouse Score**: > 90

---

**Last Updated**: October 29, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
