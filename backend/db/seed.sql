-- AgriConnect Database Seed Data
-- Initial reference data for development and production

-- ============================================================
-- REGIONS OF ETHIOPIA
-- ============================================================

INSERT INTO regions (name, zone, population, area_km2) VALUES
('Addis Ababa', NULL, 3400000, 527),
('Oromia', 'West Shewa', 35000000, 284538),
('Amhara', 'North Shewa', 21000000, 154709),
('Tigray', 'Central Tigray', 7000000, 80000),
('Afar', 'Zone 1', 1800000, 96707),
('Somali', 'Jigjiga', 5000000, 279252),
('SNNPR', 'Sidama', 15000000, 105887),
('Benishangul-Gumuz', 'Metekel', 1100000, 50699),
('Gambela', 'Anuak', 435000, 29783),
('Harari', NULL, 250000, 334),
('Dire Dawa', NULL, 500000, 1559),
('Sidama', 'Hawassa', 4500000, 6972)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CROPS
-- ============================================================

INSERT INTO crops (name_en, name_am, name_om, category) VALUES
-- Cereals
('Teff', 'ጤፍ', 'Xaafii', 'cereals'),
('Wheat', 'ስንዴ', 'Qamadii', 'cereals'),
('Barley', 'ገብስ', 'Garbuu', 'cereals'),
('Maize', 'በቆሎ', 'Boqqolloo', 'cereals'),
('Sorghum', 'ማሽላ', 'Mishingaa', 'cereals'),
('Millet', 'ዳጉሳ', 'Sanguulee', 'cereals'),
('Rice', 'ሩዝ', 'Ruuzii', 'cereals'),

-- Pulses
('Chickpea', 'ሽምብራ', 'Shunbaree', 'pulses'),
('Faba Bean', 'ባቄላ', 'Baaqelaa', 'pulses'),
('Field Pea', 'አተር', 'Atarii', 'pulses'),
('Lentil', 'ምስር', 'Misira', 'pulses'),
('Haricot Bean', 'ቦሎቄ', 'Boleqqee', 'pulses'),

-- Vegetables
('Onion', 'ቀይ ሽንኩርት', 'Qullubbii Diimaa', 'vegetables'),
('Tomato', 'ቲማቲም', 'Timaatima', 'vegetables'),
('Potato', 'ድንች', 'Dinnicha', 'vegetables'),
('Carrot', 'ካሮት', 'Kaarootii', 'vegetables'),
('Cabbage', 'ጎመን', 'Raafuu', 'vegetables'),
('Pepper', 'በርበሬ', 'Barbaree', 'vegetables'),
('Green Pepper', 'ካሪያ', 'Qareeyaa', 'vegetables'),

-- Fruits
('Banana', 'ሙዝ', 'Muuzii', 'fruits'),
('Orange', 'ብርቱካን', 'Burtukaana', 'fruits'),
('Mango', 'ማንጎ', 'Maangoo', 'fruits'),
('Papaya', 'ፓፓያ', 'Paappaaya', 'fruits'),
('Avocado', 'አቮካዶ', 'Avokaadoo', 'fruits'),
('Apple', 'ፖም', 'Poomii', 'fruits'),

-- Oilseeds
('Sesame', 'ሰሊጥ', 'Seelixii', 'oilseeds'),
('Niger Seed', 'ኑግ', 'Nuugii', 'oilseeds'),
('Linseed', 'ተልባ', 'Talbaa', 'oilseeds'),
('Sunflower', 'ሱፍ', 'Abaaboo', 'oilseeds'),

-- Cash Crops
('Coffee', 'ቡና', 'Bunaa', 'cash_crops'),
('Cotton', 'ጥጥ', 'Suufii', 'cash_crops'),
('Sugarcane', 'ሸንኮራ አገዳ', 'Shakaroo', 'cash_crops'),
('Tea', 'ሻይ', 'Shaayii', 'cash_crops'),

-- Root Crops
('Cassava', 'ካሳቫ', 'Kasaavaa', 'root_crops'),
('Sweet Potato', 'ስኳር ድንች', 'Boqqolloo Dinnichaa', 'root_crops'),
('Taro', 'ጎዴሬ', 'Gooddaree', 'root_crops'),

-- Spices
('Garlic', 'ነጭ ሽንኩርት', 'Qullubbii Adii', 'spices'),
('Ginger', 'ዝንጅብል', 'Zingibilii', 'spices'),
('Turmeric', 'ኢሪድ', 'Iridii', 'spices'),
('Cardamom', 'ከረፋ', 'Qarfaa', 'spices'),
('Black Pepper', 'ቁንዶ በርበሬ', 'Barbaree Gurraacha', 'spices')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MARKETS
-- ============================================================

INSERT INTO markets (name, region_id, location, market_type) VALUES
-- Addis Ababa
((SELECT id FROM regions WHERE name='Addis Ababa'), 'Merkato', 'wholesale'),
((SELECT id FROM regions WHERE name='Addis Ababa'), 'Piassa', 'retail'),
((SELECT id FROM regions WHERE name='Addis Ababa'), 'Shola Market', 'retail'),

-- Oromia
((SELECT id FROM regions WHERE name='Oromia'), 'Adama', 'wholesale'),
((SELECT id FROM regions WHERE name='Oromia'), 'Ambo', 'wholesale'),
((SELECT id FROM regions WHERE name='Oromia'), 'Jimma', 'wholesale'),
((SELECT id FROM regions WHERE name='Oromia'), 'Nekemte', 'retail'),
((SELECT id FROM regions WHERE name='Oromia'), 'Bishoftu', 'retail'),

-- Amhara
((SELECT id FROM regions WHERE name='Amhara'), 'Bahir Dar', 'wholesale'),
((SELECT id FROM regions WHERE name='Amhara'), 'Gondar', 'wholesale'),
((SELECT id FROM regions WHERE name='Amhara'), 'Dessie', 'retail'),
((SELECT id FROM regions WHERE name='Amhara'), 'Debre Birhan', 'retail'),

-- Tigray
((SELECT id FROM regions WHERE name='Tigray'), 'Mekelle', 'wholesale'),
((SELECT id FROM regions WHERE name='Tigray'), 'Adigrat', 'retail'),
((SELECT id FROM regions WHERE name='Tigray'), 'Shire', 'retail'),

-- SNNPR
((SELECT id FROM regions WHERE name='SNNPR'), 'Hawassa', 'wholesale'),
((SELECT id FROM regions WHERE name='SNNPR'), 'Arba Minch', 'retail'),
((SELECT id FROM regions WHERE name='SNNPR'), 'Sodo', 'retail'),

-- Dire Dawa
((SELECT id FROM regions WHERE name='Dire Dawa'), 'Central Market', 'wholesale'),

-- Harar
((SELECT id FROM regions WHERE name='Harari'), 'Harar Market', 'retail')
ON CONFLICT DO NOTHING;

-- Fix the INSERT syntax (region_id should be first)
DELETE FROM markets;

INSERT INTO markets (name, region_id, location, market_type) VALUES
-- Addis Ababa
('Merkato', (SELECT id FROM regions WHERE name='Addis Ababa'), 'Central Addis', 'wholesale'),
('Piassa', (SELECT id FROM regions WHERE name='Addis Ababa'), 'Downtown', 'retail'),
('Shola Market', (SELECT id FROM regions WHERE name='Addis Ababa'), 'Bole', 'retail'),

-- Oromia
('Adama Market', (SELECT id FROM regions WHERE name='Oromia'), 'Adama Town', 'wholesale'),
('Ambo Market', (SELECT id FROM regions WHERE name='Oromia'), 'Ambo Town', 'wholesale'),
('Jimma Market', (SELECT id FROM regions WHERE name='Oromia'), 'Jimma Town', 'wholesale'),
('Nekemte Market', (SELECT id FROM regions WHERE name='Oromia'), 'Nekemte', 'retail'),
('Bishoftu Market', (SELECT id FROM regions WHERE name='Oromia'), 'Bishoftu', 'retail'),

-- Amhara
('Bahir Dar Market', (SELECT id FROM regions WHERE name='Amhara'), 'Bahir Dar', 'wholesale'),
('Gondar Market', (SELECT id FROM regions WHERE name='Amhara'), 'Gondar', 'wholesale'),
('Dessie Market', (SELECT id FROM regions WHERE name='Amhara'), 'Dessie', 'retail'),
('Debre Birhan Market', (SELECT id FROM regions WHERE name='Amhara'), 'Debre Birhan', 'retail'),

-- Tigray
('Mekelle Market', (SELECT id FROM regions WHERE name='Tigray'), 'Mekelle', 'wholesale'),
('Adigrat Market', (SELECT id FROM regions WHERE name='Tigray'), 'Adigrat', 'retail'),
('Shire Market', (SELECT id FROM regions WHERE name='Tigray'), 'Shire', 'retail'),

-- SNNPR
('Hawassa Market', (SELECT id FROM regions WHERE name='SNNPR'), 'Hawassa', 'wholesale'),
('Arba Minch Market', (SELECT id FROM regions WHERE name='SNNPR'), 'Arba Minch', 'retail'),
('Sodo Market', (SELECT id FROM regions WHERE name='SNNPR'), 'Sodo', 'retail'),

-- Dire Dawa
('Dire Dawa Central', (SELECT id FROM regions WHERE name='Dire Dawa'), 'City Center', 'wholesale'),

-- Harar
('Harar Market', (SELECT id FROM regions WHERE name='Harari'), 'Old Town', 'retail');

-- ============================================================
-- DEMO USERS (for development/testing)
-- Password: "password123" hashed with bcrypt
-- ============================================================

INSERT INTO users (phone, password_hash, full_name, role, region_id, preferred_lang, is_verified, is_active) VALUES
-- Admin
('0911111111', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Admin User', 'admin', (SELECT id FROM regions WHERE name='Addis Ababa'), 'en', TRUE, TRUE),

-- Farmers
('0922222222', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Abebe Kebede', 'farmer', (SELECT id FROM regions WHERE name='Oromia'), 'am', TRUE, TRUE),
('0933333333', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Chaltu Hundessa', 'farmer', (SELECT id FROM regions WHERE name='Oromia'), 'om', TRUE, TRUE),
('0944444444', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Tigist Alemu', 'farmer', (SELECT id FROM regions WHERE name='Amhara'), 'am', TRUE, TRUE),
('0955555555', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Gebre Mariam', 'farmer', (SELECT id FROM regions WHERE name='SNNPR'), 'en', TRUE, TRUE),

-- Buyers
('0966666666', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Mohammed Ali', 'buyer', (SELECT id FROM regions WHERE name='Addis Ababa'), 'en', TRUE, TRUE),
('0977777777', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Sarah Johnson', 'buyer', (SELECT id FROM regions WHERE name='Addis Ababa'), 'en', TRUE, TRUE),
('0988888888', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Yohannes Tesfaye', 'buyer', (SELECT id FROM regions WHERE name='Dire Dawa'), 'am', TRUE, TRUE),

-- Agronomist
('0999999999', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO', 'Dr. Bekele Tadesse', 'agronomist', (SELECT id FROM regions WHERE name='Addis Ababa'), 'en', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEMO LISTINGS
-- ============================================================

INSERT INTO listings (farmer_id, crop_id, region_id, title, description, quantity, unit, price_per_unit, location_detail, harvest_date, image_urls, status) VALUES
(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Teff'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Premium White Teff, 2026 Harvest',
  'High-quality white teff from our organic farm. Well-cleaned and stored properly. Ready for immediate delivery.',
  150,
  'quintal',
  2800,
  'Near Adama, 20km from main road',
  '2026-09-15',
  ARRAY[]::TEXT[],
  'active'
),
(
  (SELECT id FROM users WHERE phone='0933333333'),
  (SELECT id FROM crops WHERE name_en='Maize'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Fresh Yellow Maize - Bulk Available',
  'Fresh maize from this season. Suitable for both human consumption and animal feed. Moisture content below 13%.',
  300,
  'quintal',
  1200,
  'Jimma Zone, Mana Woreda',
  '2026-10-01',
  ARRAY[]::TEXT[],
  'active'
),
(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Wheat'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Organic Wheat - Export Quality',
  'Organic wheat certified for export. No pesticides used. Perfect for bread making.',
  200,
  'quintal',
  2200,
  'Gondar, near airport',
  '2026-08-20',
  ARRAY[]::TEXT[],
  'active'
),
(
  (SELECT id FROM users WHERE phone='0955555555'),
  (SELECT id FROM crops WHERE name_en='Coffee'),
  (SELECT id FROM regions WHERE name='SNNPR'),
  'Grade 1 Washed Coffee Beans',
  'Premium Sidamo coffee, fully washed and sun-dried. Grade 1 quality with cupping score 88+',
  50,
  'quintal',
  8500,
  'Yirgacheffe, Gedeo Zone',
  '2026-09-10',
  ARRAY[]::TEXT[],
  'active'
),
(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Chickpea'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Desi Chickpea - Premium Grade',
  'Small-seeded desi chickpea, perfect for shiro powder. Clean and dry.',
  80,
  'quintal',
  3200,
  'West Shewa',
  '2026-09-25',
  ARRAY[]::TEXT[],
  'active'
),
(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Onion'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Red Onion - Fresh from Farm',
  'Fresh red onions, good for long-term storage. Medium to large size.',
  120,
  'quintal',
  1800,
  'Bahir Dar area',
  '2026-10-10',
  ARRAY[]::TEXT[],
  'active'
);

-- ============================================================
-- DEMO INQUIRIES
-- ============================================================

INSERT INTO inquiries (listing_id, buyer_id, quantity_wanted, offered_price, message, status) VALUES
(
  (SELECT id FROM listings WHERE title LIKE '%Teff%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0966666666'),
  30,
  2750,
  'Can you deliver to Addis Ababa? I need this by next week.',
  'pending'
),
(
  (SELECT id FROM listings WHERE title LIKE '%Maize%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0977777777'),
  100,
  NULL,
  'Interested in bulk purchase. What is your best price for 100 quintals?',
  'accepted'
),
(
  (SELECT id FROM listings WHERE title LIKE '%Coffee%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0966666666'),
  20,
  8200,
  'Looking for export quality coffee. Can I get a sample first?',
  'pending'
);

-- ============================================================
-- WELCOME NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (user_id, type, message) VALUES
((SELECT id FROM users WHERE phone='0922222222'), 'welcome', 'Welcome to AgriConnect! Start listing your produce.'),
((SELECT id FROM users WHERE phone='0933333333'), 'welcome', 'Welcome to AgriConnect! Connect with buyers across Ethiopia.'),
((SELECT id FROM users WHERE phone='0944444444'), 'welcome', 'Welcome to AgriConnect! Your marketplace for agricultural success.'),
((SELECT id FROM users WHERE phone='0955555555'), 'welcome', 'Welcome to AgriConnect! List your premium produce today.'),
((SELECT id FROM users WHERE phone='0966666666'), 'welcome', 'Welcome to AgriConnect! Find quality produce from trusted farmers.'),
((SELECT id FROM users WHERE phone='0977777777'), 'welcome', 'Welcome to AgriConnect! Browse listings and connect with farmers.'),
((SELECT id FROM users WHERE phone='0988888888'), 'welcome', 'Welcome to AgriConnect! Start exploring the marketplace.'),
((SELECT id FROM users WHERE phone='0999999999'), 'welcome', 'Welcome to AgriConnect! Track prices and support farmers.');

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT 'Seed data loaded successfully!' AS status;
SELECT COUNT(*) AS regions FROM regions;
SELECT COUNT(*) AS crops FROM crops;
SELECT COUNT(*) AS markets FROM markets;
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS listings FROM listings;
SELECT COUNT(*) AS inquiries FROM inquiries;
