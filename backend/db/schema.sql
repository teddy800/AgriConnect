-- AgriConnect Database Schema
-- PostgreSQL 14+
-- Complete schema with indexes, constraints, and triggers

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

-- Regions of Ethiopia
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  zone VARCHAR(100),
  population INTEGER,
  area_km2 DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regions_name ON regions(name);

-- Agricultural crops
CREATE TABLE IF NOT EXISTS crops (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_am VARCHAR(100),
  name_om VARCHAR(100),
  category VARCHAR(50), -- cereals, pulses, vegetables, fruits, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crops_name_en ON crops(name_en);
CREATE INDEX idx_crops_category ON crops(category);

-- Markets for price tracking
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
  location VARCHAR(200),
  market_type VARCHAR(50), -- wholesale, retail, export
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_markets_region ON markets(region_id);
CREATE INDEX idx_markets_name ON markets(name);

-- ============================================================
-- USER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(10) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin', 'agronomist')),
  region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
  preferred_lang VARCHAR(5) DEFAULT 'en' CHECK (preferred_lang IN ('en', 'am', 'om')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  CONSTRAINT chk_phone_format CHECK (phone ~ '^(09|07)[0-9]{8}$')
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ============================================================
-- MARKETPLACE
-- ============================================================

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'quintal', 'ton', 'piece')),
  price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
  location_detail VARCHAR(200),
  harvest_date DATE,
  image_urls TEXT[], -- Array of image URLs
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'removed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_farmer ON listings(farmer_id);
CREATE INDEX idx_listings_crop ON listings(crop_id);
CREATE INDEX idx_listings_region ON listings(region_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_active ON listings(status, created_at DESC) WHERE status = 'active';

-- Full-text search on title
CREATE INDEX idx_listings_title_search ON listings USING gin(to_tsvector('english', title));

-- ============================================================
-- INQUIRIES & TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity_wanted DECIMAL(10,2) NOT NULL CHECK (quantity_wanted > 0),
  offered_price DECIMAL(10,2) CHECK (offered_price IS NULL OR offered_price > 0),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inquiries_listing ON inquiries(listing_id);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);

-- ============================================================
-- MARKET PRICES
-- ============================================================

CREATE TABLE IF NOT EXISTS market_prices (
  id SERIAL PRIMARY KEY,
  crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  unit VARCHAR(20) DEFAULT 'quintal' CHECK (unit IN ('kg', 'quintal', 'ton')),
  recorded_on DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(crop_id, market_id, recorded_on)
);

CREATE INDEX idx_market_prices_crop ON market_prices(crop_id);
CREATE INDEX idx_market_prices_market ON market_prices(market_id);
CREATE INDEX idx_market_prices_date ON market_prices(recorded_on DESC);
CREATE INDEX idx_market_prices_crop_date ON market_prices(crop_id, recorded_on DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- welcome, new_inquiry, inquiry_update, price_alert, etc.
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================

-- Active listings with full details
CREATE OR REPLACE VIEW v_active_listings AS
SELECT 
  l.id,
  l.title,
  l.quantity,
  l.unit,
  l.price_per_unit,
  l.location_detail,
  l.harvest_date,
  l.image_urls,
  l.created_at,
  c.name_en AS crop_name,
  c.category AS crop_category,
  r.name AS region_name,
  u.full_name AS farmer_name,
  u.phone AS farmer_phone,
  u.is_verified AS farmer_verified,
  (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.id) AS inquiry_count
FROM listings l
JOIN crops c ON c.id = l.crop_id
JOIN regions r ON r.id = l.region_id
JOIN users u ON u.id = l.farmer_id
WHERE l.status = 'active' AND u.is_active = TRUE;

-- Latest market prices with trends
CREATE OR REPLACE VIEW v_latest_prices AS
WITH latest AS (
  SELECT DISTINCT ON (crop_id, market_id) 
    crop_id, market_id, price, recorded_on
  FROM market_prices
  ORDER BY crop_id, market_id, recorded_on DESC
)
SELECT 
  l.crop_id,
  l.market_id,
  c.name_en AS crop_name,
  m.name AS market_name,
  r.name AS region_name,
  l.price,
  l.recorded_on,
  prev.price AS previous_price,
  CASE 
    WHEN prev.price IS NOT NULL AND prev.price > 0 
    THEN ROUND(((l.price - prev.price) / prev.price * 100)::numeric, 1)
    ELSE NULL
  END AS price_change_percent
FROM latest l
JOIN crops c ON c.id = l.crop_id
JOIN markets m ON m.id = l.market_id
LEFT JOIN regions r ON r.id = m.region_id
LEFT JOIN LATERAL (
  SELECT price 
  FROM market_prices 
  WHERE crop_id = l.crop_id 
    AND market_id = l.market_id 
    AND recorded_on < l.recorded_on
  ORDER BY recorded_on DESC 
  LIMIT 1
) prev ON TRUE;

-- Platform statistics
CREATE OR REPLACE VIEW v_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
  (SELECT COUNT(*) FROM users WHERE role = 'farmer' AND is_active = TRUE) AS active_farmers,
  (SELECT COUNT(*) FROM users WHERE role = 'buyer' AND is_active = TRUE) AS active_buyers,
  (SELECT COUNT(*) FROM listings WHERE status = 'active') AS active_listings,
  (SELECT COUNT(*) FROM inquiries WHERE status = 'pending') AS pending_inquiries,
  (SELECT COUNT(*) FROM inquiries WHERE status = 'completed') AS completed_deals,
  (SELECT COUNT(DISTINCT crop_id) FROM listings WHERE status = 'active') AS crops_available;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get listing with market price comparison
CREATE OR REPLACE FUNCTION get_listing_with_market_avg(listing_uuid UUID)
RETURNS TABLE (
  listing JSON,
  market_avg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(l.*) AS listing,
    (SELECT ROUND(AVG(price)::numeric, 2)
     FROM (
       SELECT DISTINCT ON (market_id) price
       FROM market_prices
       WHERE crop_id = l.crop_id AND unit = 'quintal'
       ORDER BY market_id, recorded_on DESC
     ) t
    ) AS market_avg
  FROM listings l
  WHERE l.id = listing_uuid;
END;
$$ LANGUAGE plpgsql;

-- Search listings with relevance scoring
CREATE OR REPLACE FUNCTION search_listings(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    ts_rank(to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')), 
            plainto_tsquery('english', search_term)) AS score
  FROM listings l
  WHERE l.status = 'active'
    AND to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) @@ 
        plainto_tsquery('english', search_term)
  ORDER BY score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERMISSIONS (uncomment for production)
-- ============================================================

-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO agriconnect_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agriconnect_app;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE users IS 'User accounts - farmers, buyers, admins, agronomists';
COMMENT ON TABLE listings IS 'Agricultural produce listings posted by farmers';
COMMENT ON TABLE inquiries IS 'Purchase inquiries from buyers to farmers';
COMMENT ON TABLE market_prices IS 'Historical market prices for crops';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE crops IS 'Master list of agricultural crops';
COMMENT ON TABLE regions IS 'Ethiopian regions and administrative zones';
COMMENT ON TABLE markets IS 'Physical markets for price tracking';

COMMENT ON COLUMN users.is_verified IS 'Verified by admin or through validation process';
COMMENT ON COLUMN listings.status IS 'active=available, sold=purchased, expired=old, removed=deleted by farmer/admin';
COMMENT ON COLUMN inquiries.status IS 'pending=awaiting response, accepted=farmer approved, rejected=farmer declined, completed=deal finished';
