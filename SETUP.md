# 🚀 AgriConnect Setup Guide

Complete step-by-step guide to get AgriConnect running on your machine.

## 📋 Prerequisites

Before you begin, ensure you have installed:

- ✅ **Node.js** 18 or higher ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- ✅ **Git** ([Download](https://git-scm.com/downloads))
- ✅ **npm** or **yarn** (comes with Node.js)

### Verify Installation

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 8.0.0 or higher
psql --version    # Should show 14.0 or higher
```

## 🗄️ Step 1: Database Setup

### Windows

```cmd
# Start PostgreSQL service (if not running)
net start postgresql-x64-14

# Create database
psql -U postgres
CREATE DATABASE agriconnect;
\q
```

### macOS / Linux

```bash
# Start PostgreSQL
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS

# Create database
createdb agriconnect

# Or using psql
psql -U postgres
CREATE DATABASE agriconnect;
\q
```

### Initialize Schema and Data

```bash
# Navigate to project directory
cd C:\Users\HP\Desktop\AgriConnect

# Run schema (creates tables)
psql -U postgres -d agriconnect -f backend\db\schema.sql

# Seed reference data
psql -U postgres -d agriconnect -f backend\db\seed.sql

# Add market prices (optional but recommended)
psql -U postgres -d agriconnect -f backend\db\seed2.sql
```

## ⚙️ Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (already exists, verify settings)
# Edit if needed: DB_PASSWORD, JWT_SECRET

# Verify database connection
psql -U postgres -d agriconnect -c "SELECT COUNT(*) FROM users;"
# Should show count of users

# Start development server
npm run dev
```

Backend should start on **http://localhost:4000**

### Verify Backend

Open: http://localhost:4000/api/health

Should see:
```json
{
  "ok": true,
  "timestamp": "2026-10-17T...",
  "service": "AgriConnect API",
  "version": "1.0.0"
}
```

## 🎨 Step 3: Frontend Setup

Open a **NEW terminal window** (keep backend running):

```bash
# Navigate to frontend folder
cd C:\Users\HP\Desktop\AgriConnect\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should start on **http://localhost:5173**

## 🌐 Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

### Demo Login Credentials

| Role | Phone | Password |
|------|-------|----------|
| **Admin** | 0911111111 | password123 |
| **Farmer** | 0922222222 | password123 |
| **Farmer** | 0933333333 | password123 |
| **Buyer** | 0966666666 | password123 |
| **Agronomist** | 0999999999 | password123 |

## ✅ Verification Checklist

Run these tests to ensure everything works:

### 1. Test Database

```bash
# Check if tables exist
psql -U postgres -d agriconnect -c "\dt"

# Should show: users, listings, inquiries, crops, regions, markets, etc.
```

### 2. Test Backend API

```bash
# Health check
curl http://localhost:4000/api/health

# Get crops
curl http://localhost:4000/api/crops

# Login test
curl -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"0966666666\",\"password\":\"password123\"}"
```

### 3. Test Frontend

- ✅ Visit http://localhost:5173
- ✅ Login page loads
- ✅ Can login with demo account
- ✅ Dashboard shows statistics
- ✅ Can navigate to Marketplace
- ✅ Listings are displayed

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Database: localhost:5432

## 🔧 Troubleshooting

### Issue: "Port already in use"

**Backend (Port 4000):**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4000 | xargs kill -9
```

**Frontend (Port 5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### Issue: "Database connection failed"

```bash
# Verify PostgreSQL is running
# Windows
sc query postgresql-x64-14

# Linux
sudo systemctl status postgresql

# macOS
brew services list
```

### Issue: "Module not found"

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Permission denied" on PostgreSQL

```bash
# Update PostgreSQL password
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
\q

# Update backend\.env
DB_PASSWORD=postgres
```

### Issue: "Cannot GET /api/..."

- ✅ Verify backend is running (check terminal)
- ✅ Check backend logs for errors
- ✅ Verify Vite proxy configuration in `frontend/vite.config.js`

## 📊 Verify Data

### Check Users
```sql
psql -U postgres -d agriconnect
SELECT phone, full_name, role FROM users;
```

### Check Listings
```sql
SELECT title, quantity, unit, price_per_unit, status FROM listings;
```

### Check Market Prices
```sql
SELECT c.name_en, m.name, mp.price, mp.recorded_on 
FROM market_prices mp
JOIN crops c ON c.id = mp.crop_id
JOIN markets m ON m.id = mp.market_id
ORDER BY mp.recorded_on DESC
LIMIT 10;
```

## 🎉 Success!

If you can:
- ✅ Login with demo account
- ✅ See dashboard with statistics
- ✅ Browse marketplace listings
- ✅ View market prices chart
- ✅ Switch languages (English/Amharic/Afaan Oromoo)

**You're all set!** 🌾

## 📚 Next Steps

- Read the [README.md](README.md) for API documentation
- Explore the codebase
- Create your own farmer/buyer account
- Post test listings
- Send inquiries

## 🆘 Need Help?

- Check the [README.md](README.md) for documentation
- Review error logs in terminal
- Ensure all services are running
- Verify environment variables in `.env`

---

**Happy Coding!** 🚀
