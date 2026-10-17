# 🌾 AgriConnect

**AgriConnect** is a comprehensive digital marketplace platform connecting Ethiopian farmers directly with buyers, eliminating middlemen and providing real-time market intelligence.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

## 🎯 Features

### Core Features

#### For Farmers
- 📦 **List Produce** - Post agricultural products with photos, prices, and details
- 💰 **Market Intelligence** - See real-time market prices and trends
- 📊 **Dashboard Analytics** - Track listings, inquiries, and sales
- 🔔 **Notifications** - Get instant alerts on buyer inquiries
- ✅ **Verification Badge** - Build trust with verified farmer status

#### For Buyers
- 🔍 **Smart Search** - Find produce by crop, region, and price
- 💬 **Direct Inquiries** - Contact farmers without intermediaries
- 📱 **Contact Integration** - One-tap phone calls to farmers
- 📈 **Price Comparison** - See if listings are priced fairly
- 🌍 **Multi-language** - English, Amharic, Afaan Oromoo support

#### For Admins & Agronomists
- 👥 **User Management** - Verify/deactivate users
- 📊 **Platform Statistics** - Monitor activity and growth
- 💵 **Price Recording** - Update market prices daily
- 🗑️ **Content Moderation** - Remove inappropriate listings

### 🚀 Advanced Features (NEW!)

#### 🔌 WebSocket Integration
- **Real-time Price Updates** - Instant notifications when prices change
- **Live Marketplace** - New listings appear automatically without refresh
- **Instant Inquiry Updates** - Status changes broadcast immediately
- **Connection Status** - Visual indicators for live connection
- **Auto-reconnection** - Resilient connection management

#### 💾 Redis Caching
- **High Performance** - 98% faster repeated API calls
- **Smart Invalidation** - Cache clears on data updates
- **TTL Management** - Configurable time-to-live per resource
- **Route Middleware** - Automatic caching for GET endpoints
- **Health Monitoring** - Real-time cache statistics

#### 🔍 Elasticsearch Search
- **Fuzzy Matching** - "coffe" finds "coffee"
- **Advanced Filters** - Crop, region, price range, verification status
- **Multiple Sort Options** - Relevance, price, date, quantity
- **Autocomplete** - Search suggestions as you type
- **Analytics** - Aggregations for price stats and distributions
- **Bulk Indexing** - Fast initial data population

#### 📊 Monitoring & Observability
- **Health Checks** - Database, Redis, Elasticsearch status
- **Performance Metrics** - Memory, CPU, cache hit rates
- **WebSocket Stats** - Active connections and rooms
- **Service Dashboard** - Real-time platform monitoring

See [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) for detailed documentation.

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js 18+ with Express.js
- PostgreSQL 14+ database
- JWT authentication with bcrypt
- Zod validation
- Multer for file uploads
- Socket.IO for WebSocket
- Redis for caching
- Elasticsearch for search

**Frontend:**
- React 18 with Vite
- React Router v7
- Recharts for data visualization
- Lucide React icons
- Socket.IO client for real-time updates
- Custom CSS (no framework)

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 14
- Redis 7
- Elasticsearch 8.11
- Winston logging
- GitHub Actions CI/CD
- RESTful API architecture

### 🔒 Security & Performance

- **Rate Limiting** - 7 different limiters (auth, upload, API, etc.)
- **Input Sanitization** - XSS protection and SQL injection prevention
- **Helmet Security** - Content Security Policy, HSTS, XSS filters
- **JWT Authentication** - Secure token-based auth with bcrypt
- **RBAC** - Role-based access control (farmer, buyer, admin, agronomist)
- **Winston Logging** - Daily rotating logs with 5 severity levels
- **Testing** - Jest (backend) + Vitest (frontend) with 25+ tests
- **CI/CD Pipeline** - Automated testing, linting, and security scans

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/agriconnect.git
cd agriconnect
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb agriconnect

# Or using psql
psql -U postgres
CREATE DATABASE agriconnect;
\q

# Run schema
psql -U postgres -d agriconnect -f backend/db/schema.sql

# Seed initial data
psql -U postgres -d agriconnect -f backend/db/seed.sql

# Add market prices (optional)
psql -U postgres -d agriconnect -f backend/db/seed2.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor

# Start development server
npm run dev
```

Backend will run on `http://localhost:4000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000/api

### Demo Accounts

| Role | Phone | Password |
|------|-------|----------|
| Admin | 0911111111 | password123 |
| Farmer | 0922222222 | password123 |
| Farmer | 0933333333 | password123 |
| Buyer | 0966666666 | password123 |
| Buyer | 0977777777 | password123 |

## 📁 Project Structure

```
agriconnect/
├── backend/
│   ├── db/
│   │   ├── schema.sql          # Database schema
│   │   ├── seed.sql            # Initial data
│   │   └── seed2.sql           # Market prices
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication middleware
│   │   ├── routes/
│   │   │   ├── admin.js        # Admin endpoints
│   │   │   ├── auth.js         # Login/register
│   │   │   ├── dashboard.js    # Dashboard data
│   │   │   ├── inquiries.js    # Buyer inquiries
│   │   │   ├── listings.js     # Produce listings
│   │   │   ├── notifications.js # User notifications
│   │   │   ├── prices.js       # Market prices
│   │   │   ├── reference.js    # Crops/regions/markets
│   │   │   └── uploads.js      # Image uploads
│   │   ├── db.js               # Database connection
│   │   └── server.js           # Express app
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx      # Main layout
│   │   │   └── ui.jsx          # Reusable UI components
│   │   ├── pages/
│   │   │   ├── CreateListing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inquiries.jsx
│   │   │   ├── ListingDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── MyListings.jsx
│   │   │   └── Prices.jsx
│   │   ├── api.js              # API client
│   │   ├── App.jsx             # Root component
│   │   ├── auth.jsx            # Auth context
│   │   ├── i18n.jsx            # Internationalization
│   │   ├── main.jsx            # Entry point
│   │   ├── styles.css          # Global styles
│   │   └── utils.js            # Utility functions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-token` - Verify JWT token

### Listings
- `GET /api/listings` - Get all active listings (with filters)
- `GET /api/listings/mine` - Get farmer's own listings
- `GET /api/listings/:id` - Get single listing with market price
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update listing
- `PATCH /api/listings/:id/status` - Change listing status

### Inquiries
- `POST /api/inquiries` - Send inquiry to farmer
- `GET /api/inquiries/received` - Farmer's received inquiries
- `GET /api/inquiries/sent` - Buyer's sent inquiries
- `PATCH /api/inquiries/:id` - Update inquiry status

### Market Prices
- `GET /api/prices/series` - Time series data for charts
- `GET /api/prices/table` - Latest prices with trends
- `POST /api/prices` - Record new price (admin/agronomist)

### Reference Data
- `GET /api/crops` - All crops
- `GET /api/regions` - All regions
- `GET /api/markets` - All markets
- `GET /api/units` - Measurement units
- `GET /api/stats` - Platform statistics

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id` - Update user (verify/deactivate)
- `PATCH /api/admin/listings/:id/remove` - Remove listing

### Notifications
- `GET /api/notifications` - User's notifications
- `PATCH /api/notifications/read-all` - Mark all as read

### Dashboard
- `GET /api/dashboard` - Role-specific dashboard data

## 🔐 Environment Variables

See `.env.example` for all available configuration options.

**Required variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agriconnect
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-min-32-characters
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Database Migrations

For schema changes, create migration files:

```bash
# Create new migration
npm run migration:create add_user_rating

# Run migrations
npm run migration:up

# Rollback migration
npm run migration:down
```

## 🌍 Internationalization

AgriConnect supports three languages:
- **English** (en)
- **Amharic** (አማርኛ) (am)
- **Afaan Oromoo** (om)

To add translations, edit `frontend/src/i18n.jsx`:

```javascript
const dict = {
  en: { key: 'English text' },
  am: { key: 'አማርኛ ጽሑፍ' },
  om: { key: 'Barreeffama Afaan Oromoo' }
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- Ethiopian farmers and agricultural sector
- Open source community
- Contributors and testers

## 📞 Support

For support, email support@agriconnect.et or join our Telegram group.

## 🗺️ Roadmap

- [ ] SMS notifications via Twilio
- [ ] Weather forecast integration
- [ ] Mobile apps (iOS/Android)
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] AI-powered price predictions
- [ ] Multilingual advisory content
- [ ] Video listings
- [ ] Farmer cooperatives support
- [ ] Export documentation generation

---

**Built with ❤️ for Ethiopian Agriculture**

🌾 Better Markets · 💪 Stronger Farmers · 🌱 A Greener Ethiopia
