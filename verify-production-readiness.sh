#!/bin/bash
# AgriConnect Production Readiness Verification Script
# Comprehensive checklist validator before deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║   AgriConnect Production Readiness Verification   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ============================================
# 1. ENVIRONMENT CONFIGURATION
# ============================================
echo -e "${BLUE}[1/10] Environment Configuration${NC}"
echo "-----------------------------------"

if [ -f "backend/.env.production" ]; then
    check_pass "Production environment file exists"
    
    # Check for placeholder values
    if grep -q "CHANGE_THIS" backend/.env.production; then
        check_fail "Environment file contains CHANGE_THIS placeholders"
    else
        check_pass "No placeholder values in environment"
    fi
    
    # Check JWT_SECRET strength
    JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env.production | cut -d'=' -f2)
    if [ ${#JWT_SECRET} -ge 64 ]; then
        check_pass "JWT_SECRET is strong (${#JWT_SECRET} characters)"
    else
        check_fail "JWT_SECRET too short (${#JWT_SECRET} chars, need 64+)"
    fi
    
    # Check NODE_ENV
    if grep -q "NODE_ENV=production" backend/.env.production; then
        check_pass "NODE_ENV set to production"
    else
        check_fail "NODE_ENV not set to production"
    fi
    
    # Check CORS
    if grep -q "CORS_ORIGIN=https://" backend/.env.production; then
        check_pass "CORS configured with HTTPS"
    else
        check_warn "CORS might not be configured for production domain"
    fi
else
    check_fail "Production environment file missing"
fi

echo ""

# ============================================
# 2. DEPENDENCIES & PACKAGES
# ============================================
echo -e "${BLUE}[2/10] Dependencies & Packages${NC}"
echo "-------------------------------"

if [ -f "backend/package-lock.json" ]; then
    check_pass "Backend package-lock.json exists"
else
    check_fail "Backend package-lock.json missing"
fi

if [ -f "frontend/package-lock.json" ]; then
    check_pass "Frontend package-lock.json exists"
else
    check_fail "Frontend package-lock.json missing"
fi

# Check for vulnerabilities
cd backend
AUDIT_RESULT=$(npm audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    check_pass "No high/critical npm vulnerabilities in backend"
elif echo "$AUDIT_RESULT" | grep -q "high"; then
    check_fail "High severity vulnerabilities found in backend"
else
    check_warn "Some npm vulnerabilities found (run npm audit)"
fi
cd ..

echo ""

# ============================================
# 3. DATABASE CONFIGURATION
# ============================================
echo -e "${BLUE}[3/10] Database Configuration${NC}"
echo "------------------------------"

if [ -f "backend/db/schema.sql" ]; then
    check_pass "Database schema file exists"
else
    check_fail "Database schema file missing"
fi

if [ -d "backend/migrations" ] && [ "$(ls -A backend/migrations)" ]; then
    check_pass "Database migrations exist"
else
    check_warn "No database migrations found"
fi

# Check for admin setup
if [ -f "backend/db/admin_setup.sql" ]; then
    # Check if default password is still being used
    if grep -q "password123" backend/db/admin_setup.sql; then
        check_fail "Default admin password (password123) still in setup file"
    else
        check_pass "Admin setup file secured"
    fi
else
    check_warn "Admin setup file not found"
fi

echo ""

# ============================================
# 4. SECURITY CONFIGURATION
# ============================================
echo -e "${BLUE}[4/10] Security Configuration${NC}"
echo "------------------------------"

# Check middleware
if [ -f "backend/src/middleware/security.js" ]; then
    check_pass "Security middleware exists"
else
    check_warn "Security middleware missing"
fi

if [ -f "backend/src/middleware/rateLimiter.js" ]; then
    check_pass "Rate limiter middleware exists"
else
    check_warn "Rate limiter middleware missing"
fi

if [ -f "backend/src/middleware/sanitizer.js" ]; then
    check_pass "Input sanitizer exists"
else
    check_warn "Input sanitizer missing"
fi

# Check for exposed secrets
if grep -r "password123\|admin123\|secret123" backend/src/ 2>/dev/null; then
    check_fail "Hardcoded credentials found in source code"
else
    check_pass "No hardcoded credentials in source"
fi

# Check HTTPS enforcement
if grep -q "ENABLE_HTTPS_ONLY=true" backend/.env.production 2>/dev/null; then
    check_pass "HTTPS enforcement enabled"
else
    check_warn "HTTPS enforcement not explicitly enabled"
fi

echo ""

# ============================================
# 5. FRONTEND BUILD
# ============================================
echo -e "${BLUE}[5/10] Frontend Build${NC}"
echo "----------------------"

cd frontend

if [ -f "vite.config.js" ]; then
    check_pass "Vite configuration exists"
else
    check_fail "Vite configuration missing"
fi

# Try building frontend
echo "Building frontend (this may take a minute)..."
BUILD_OUTPUT=$(npm run build 2>&1 || true)

if echo "$BUILD_OUTPUT" | grep -q "built in"; then
    check_pass "Frontend builds successfully"
    
    # Check bundle size
    if [ -d "dist/assets" ]; then
        BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
        echo -e "  ${BLUE}ℹ${NC}  Bundle size: $BUNDLE_SIZE"
        check_pass "Frontend bundle created"
    else
        check_fail "Frontend dist directory not created"
    fi
else
    check_fail "Frontend build failed"
fi

cd ..

echo ""

# ============================================
# 6. BACKEND TESTS & LINT
# ============================================
echo -e "${BLUE}[6/10] Backend Quality${NC}"
echo "----------------------"

cd backend

# Lint check
LINT_OUTPUT=$(npm run lint 2>&1 || true)
if echo "$LINT_OUTPUT" | grep -q "0 errors"; then
    check_pass "Backend linting passes (0 errors)"
else
    check_warn "Backend has linting errors"
fi

# Check if tests exist
if [ -d "tests" ] && [ "$(ls -A tests)" ]; then
    check_pass "Backend tests exist"
else
    check_warn "No backend tests found"
fi

cd ..

echo ""

# ============================================
# 7. DEPLOYMENT SCRIPTS
# ============================================
echo -e "${BLUE}[7/10] Deployment Scripts${NC}"
echo "--------------------------"

# Check deployment scripts
if [ -f "deploy-production.sh" ] && [ -x "deploy-production.sh" ]; then
    check_pass "Deployment script exists and is executable"
else
    check_warn "Deployment script missing or not executable"
fi

if [ -f "rollback.sh" ] && [ -x "rollback.sh" ]; then
    check_pass "Rollback script exists and is executable"
else
    check_warn "Rollback script missing or not executable"
fi

if [ -f "ecosystem.config.js" ]; then
    check_pass "PM2 ecosystem configuration exists"
else
    check_warn "PM2 configuration missing"
fi

if [ -f "backend/scripts/backup-database.sh" ]; then
    check_pass "Database backup script exists"
else
    check_warn "Database backup script missing"
fi

echo ""

# ============================================
# 8. MONITORING & LOGGING
# ============================================
echo -e "${BLUE}[8/10] Monitoring & Logging${NC}"
echo "----------------------------"

# Check Sentry configuration
if grep -q "SENTRY_ENABLED=true" backend/.env.production 2>/dev/null; then
    if grep -q "SENTRY_DSN=https://" backend/.env.production; then
        check_pass "Sentry error tracking configured"
    else
        check_warn "Sentry enabled but DSN not configured"
    fi
else
    check_warn "Sentry error tracking not enabled"
fi

# Check logging
if [ -f "backend/src/utils/logger.js" ]; then
    check_pass "Logger utility exists"
else
    check_warn "Logger utility missing"
fi

if [ -d "backend/logs" ]; then
    check_pass "Logs directory exists"
else
    check_warn "Logs directory missing"
fi

echo ""

# ============================================
# 9. SSL/HTTPS SETUP
# ============================================
echo -e "${BLUE}[9/10] SSL/HTTPS Configuration${NC}"
echo "-------------------------------"

if [ -f "setup-ssl.sh" ] && [ -x "setup-ssl.sh" ]; then
    check_pass "SSL setup script exists"
else
    check_warn "SSL setup script missing"
fi

# Check for nginx config
if [ -f "nginx.conf" ]; then
    check_pass "Nginx configuration exists"
    
    if grep -q "ssl_certificate" nginx.conf; then
        check_pass "SSL configured in Nginx"
    else
        check_warn "SSL not configured in Nginx"
    fi
else
    check_warn "Nginx configuration missing"
fi

echo ""

# ============================================
# 10. OPTIONAL SERVICES
# ============================================
echo -e "${BLUE}[10/10] Optional Services${NC}"
echo "--------------------------"

# Redis
if grep -q "REDIS_ENABLED=true" backend/.env.production 2>/dev/null; then
    if [ -f "backend/src/utils/cache.js" ]; then
        check_pass "Redis caching enabled and configured"
    else
        check_warn "Redis enabled but cache utility missing"
    fi
else
    echo -e "  ${BLUE}ℹ${NC}  Redis caching: disabled (optional)"
fi

# Elasticsearch
if grep -q "ELASTICSEARCH_ENABLED=true" backend/.env.production 2>/dev/null; then
    if [ -f "backend/src/utils/elasticsearch.js" ]; then
        check_pass "Elasticsearch enabled and configured"
    else
        check_warn "Elasticsearch enabled but utility missing"
    fi
else
    echo -e "  ${BLUE}ℹ${NC}  Elasticsearch: disabled (optional)"
fi

# Email
if grep -q "EMAIL_ENABLED=true" backend/.env.production 2>/dev/null; then
    check_pass "Email service enabled"
else
    echo -e "  ${BLUE}ℹ${NC}  Email service: disabled (optional)"
fi

# SMS
if grep -q "SMS_ENABLED=true" backend/.env.production 2>/dev/null; then
    check_pass "SMS service enabled"
else
    echo -e "  ${BLUE}ℹ${NC}  SMS service: disabled (optional)"
fi

echo ""
echo ""

# ============================================
# FINAL REPORT
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                   FINAL REPORT                     ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed:   $FAILED${NC}"
echo ""

# Calculate readiness score
TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

echo -e "Production Readiness Score: ${BLUE}$SCORE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ PRODUCTION READY! ✅                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Your application is ready for production deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Review warnings above"
    echo "2. Follow DEPLOYMENT_CHECKLIST.md"
    echo "3. Run: ./deploy-production.sh"
    echo ""
    exit 0
elif [ $FAILED -le 3 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         ⚠️  ALMOST READY - FIX CRITICAL ISSUES    ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the failed checks above before deploying to production."
    echo ""
    exit 1
else
    echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ❌ NOT READY FOR PRODUCTION ❌             ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Multiple critical issues found. Review and fix all failed checks."
    echo "See DEPLOYMENT_CHECKLIST.md for detailed requirements."
    echo ""
    exit 1
fi
