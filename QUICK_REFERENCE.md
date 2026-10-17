# 🚀 AgriConnect Quick Reference Guide

## 📦 Installation

### Option 1: Quick Setup (Recommended)
```bash
# Run the setup script
setup-advanced.bat

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

### Option 2: Docker Compose (Full Stack)
```bash
docker-compose up -d
```

---

## 🎮 Running the Application

### Development Mode

#### Start Backend
```bash
cd backend
npm run dev
# Server: http://localhost:4000
```

#### Start Frontend
```bash
cd frontend
npm run dev
# App: http://localhost:5173
```

#### Start Infrastructure Only
```bash
# PostgreSQL + Redis + Elasticsearch
docker-compose up -d database redis elasticsearch
```

### Production Mode
```bash
# All services with Docker
docker-compose up -d

# Backend production
cd backend
npm start

# Frontend build
cd frontend
npm run build
npm run preview
```

---

## 🗄️ Database Setup

### Initial Setup
```bash
cd backend

# Create database
psql -U postgres -c "CREATE DATABASE agriconnect;"

# Run schema
psql -U postgres -d agriconnect -f db/schema.sql

# Seed data
psql -U postgres -d agriconnect -f db/seed.sql
psql -U postgres -d agriconnect -f db/seed2.sql

# Or use npm script
npm run db:setup
```

### Reset Database
```bash
npm run db:reset
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suites
npm run test:unit
npm run test:integration
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 📝 Linting & Formatting

### Backend
```bash
cd backend

# Check for errors
npm run lint:check

# Fix errors
npm run lint

# Format code
npm run format
```

### Frontend
```bash
cd frontend

npm run lint
npm run format
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:4000/api
```

### Authentication
```bash
# Register
POST /api/auth/register
Body: { phone, password, full_name, role, region_id }

# Login
POST /api/auth/login
Body: { phone, password }
Returns: { token, user }

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer TOKEN
```

### Listings
```bash
# Get all listings
GET /api/listings?crop_id=1&region_id=2&max_price=5000

# Get one listing
GET /api/listings/:id

# Create listing (farmer only)
POST /api/listings
Headers: Authorization: Bearer TOKEN
Body: { crop_id, title, quantity, unit, price_per_unit, region_id }

# Update listing
PUT /api/listings/:id

# Change status
PATCH /api/listings/:id/status
Body: { status: 'active'|'sold'|'removed' }
```

### Prices
```bash
# Get price series (chart data)
GET /api/prices/series?crop_id=1&days=7

# Get price table (latest prices)
GET /api/prices/table?crop_id=1

# Record price (admin/agronomist only)
POST /api/prices
Headers: Authorization: Bearer TOKEN
Body: { crop_id, market_id, price, unit }
```

### Advanced Search
```bash
# Search listings
GET /api/search?q=coffee&crop_id=5&min_price=1000&max_price=5000&sort_by=price_asc

# Get suggestions
GET /api/search/suggestions?q=coff

# Get analytics
GET /api/search/analytics
```

### Monitoring
```bash
# Health check
GET /api/health
GET /api/monitoring/health

# Metrics
GET /api/monitoring/metrics
```

---

## 🔌 WebSocket Events

### Connect
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
});
```

### Subscribe to Price Updates
```javascript
// Subscribe
socket.emit('subscribe:prices', { cropIds: [1, 2, 3] });

// Listen
socket.on('price:update', (data) => {
  console.log('New price:', data);
});

// Unsubscribe
socket.emit('unsubscribe:prices', { cropIds: [1, 2, 3] });
```

### Subscribe to Marketplace
```javascript
socket.emit('subscribe:marketplace', { regionId: 2, cropId: 5 });

socket.on('listing:new', (listing) => {
  console.log('New listing:', listing);
});
```

### Subscribe to Inquiries
```javascript
socket.emit('subscribe:inquiries');

socket.on('inquiry:update', (inquiry) => {
  console.log('Inquiry updated:', inquiry);
});
```

---

## 🎨 Frontend Hooks

### Authentication
```javascript
import { useAuth } from './auth';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  
  if (user.role === 'farmer') {
    // Farmer specific UI
  }
}
```

### WebSocket - Price Updates
```javascript
import { usePriceUpdates } from './hooks/useWebSocket';

function PricesPage() {
  const { isConnected } = usePriceUpdates([1, 2, 3], (data) => {
    console.log('Price update:', data);
    // Refresh data
  });
  
  return <div>{isConnected ? '🟢 Live' : '🔴 Offline'}</div>;
}
```

### WebSocket - Marketplace Updates
```javascript
import { useMarketplaceUpdates } from './hooks/useWebSocket';

function Marketplace() {
  const { isConnected } = useMarketplaceUpdates(
    { regionId: 2, cropId: 5 },
    (listing) => {
      console.log('New listing:', listing);
    }
  );
}
```

### WebSocket - Generic
```javascript
import useWebSocket from './hooks/useWebSocket';

function MyComponent() {
  const { isConnected, emit, on } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = on('custom:event', (data) => {
      console.log(data);
    });
    
    return unsubscribe;
  }, []);
  
  emit('custom:action', { data: 'value' });
}
```

---

## 💾 Redis Commands

### Connect to Redis
```bash
# Via Docker
docker exec -it agriconnect-redis redis-cli

# Local
redis-cli
```

### Useful Commands
```bash
# List all keys
KEYS *

# Get value
GET "prices:series:1:7"

# Check TTL
TTL "prices:series:1:7"

# Delete key
DEL "prices:series:1:7"

# Delete pattern
KEYS "listings:*" | xargs redis-cli DEL

# Flush all
FLUSHALL

# Get info
INFO stats
INFO memory
```

---

## 🔍 Elasticsearch Commands

### Check Cluster Health
```bash
curl http://localhost:9200/_cluster/health
```

### List Indices
```bash
curl http://localhost:9200/_cat/indices?v
```

### Search Listings
```bash
curl "http://localhost:9200/listings/_search?q=coffee&size=10"
```

### Get Document
```bash
curl http://localhost:9200/listings/_doc/LISTING_ID
```

### Index Stats
```bash
curl http://localhost:9200/listings/_stats
```

### Delete Index
```bash
curl -X DELETE http://localhost:9200/listings
```

---

## 🐳 Docker Commands

### View Services
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs -f backend  # Follow

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Restart Services
```bash
# All
docker-compose restart

# Specific
docker-compose restart backend
```

### Stop Services
```bash
docker-compose stop
```

### Remove Everything
```bash
docker-compose down -v  # Including volumes
```

### Rebuild
```bash
docker-compose up -d --build
```

---

## 🔑 Environment Variables

### Backend (.env)
```bash
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agriconnect
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Advanced Features
WEBSOCKET_ENABLED=true
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=http://localhost:9200

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
```

---

## 👥 Demo Users

### Farmers
```
Phone: 0911111111, Password: password123
Phone: 0912222222, Password: password123
```

### Buyers
```
Phone: 0913333333, Password: password123
Phone: 0914444444, Password: password123
```

### Admin
```
Phone: 0900000000, Password: admin123
```

### Agronomist
```
Phone: 0919999999, Password: agro123
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Change port in .env
PORT=4001
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps database

# Restart database
docker-compose restart database

# Check logs
docker-compose logs database
```

### Redis Connection Error
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

### Elasticsearch Connection Error
```bash
# Check if Elasticsearch is running
curl http://localhost:9200/_cluster/health

# Restart
docker-compose restart elasticsearch

# Check logs
docker-compose logs elasticsearch
```

### WebSocket Not Connecting
```bash
# Check token in localStorage
localStorage.getItem('token')

# Check backend logs
docker-compose logs backend | grep WebSocket

# Check CORS_ORIGIN
echo $CORS_ORIGIN
```

---

## 📊 Monitoring

### Check System Health
```bash
# API health
curl http://localhost:4000/api/health

# Monitoring health
curl http://localhost:4000/api/monitoring/health

# Metrics
curl http://localhost:4000/api/monitoring/metrics
```

### View Logs
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Docker logs
docker-compose logs -f
```

---

## 🚀 Deployment Checklist

- [ ] Update environment variables for production
- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure SSL/TLS certificates
- [ ] Set up domain and DNS
- [ ] Configure firewall rules
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Run security audit: `npm audit`
- [ ] Run tests: `npm test`
- [ ] Build frontend: `npm run build`
- [ ] Set up CI/CD pipeline
- [ ] Document deployment process

---

## 📚 Additional Resources

- [Main README](./README.md)
- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [Advanced Features](./ADVANCED_FEATURES.md)
- [Implementation Status](./IMPLEMENTATION_COMPLETE.md)

---

## 💡 Tips

1. **Use the hooks** - Pre-built WebSocket hooks simplify integration
2. **Check logs** - Winston logs everything to `backend/logs/`
3. **Monitor Redis** - Use `redis-cli MONITOR` to watch cache activity
4. **Use Docker** - Simplifies running all services together
5. **Enable hot reload** - `npm run dev` watches for changes
6. **Check diagnostics** - Use `/api/monitoring/health` endpoint

---

*Quick Reference Guide - AgriConnect v1.0.0*
