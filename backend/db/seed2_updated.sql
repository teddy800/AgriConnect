-- AgriConnect Enhanced Seed Data with Realistic Prices and Images
-- Updated: 2026-10-21
-- Ethiopian Agricultural Market Data with Real Photos

-- ============================================================
-- UPDATE EXISTING LISTINGS WITH REALISTIC PRICES & IMAGES
-- ============================================================

-- Delete old listings first
DELETE FROM inquiries;
DELETE FROM listings;

-- ============================================================
-- REALISTIC ETHIOPIAN CROP LISTINGS WITH IMAGES
-- Prices are in ETB per quintal (100kg) - Market realistic for 2026
-- ============================================================

INSERT INTO listings (farmer_id, crop_id, region_id, title, description, quantity, unit, price_per_unit, location_detail, harvest_date, image_urls, status) VALUES

-- TEFF (Premium grain - expensive)
(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Teff'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Premium White Teff - Grade A Quality',
  'Exceptional white teff from organic farm in West Shewa. Carefully cleaned, 99% purity, moisture content 10%. Perfect for high-quality injera. Stored in clean, dry warehouse. Available for immediate pickup or delivery to major cities. Certification available upon request.',
  150,
  'quintal',
  8500,
  'Cheliya, 20km from Adama main road',
  '2026-09-15',
  ARRAY[
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
    'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Teff'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Red Teff - Traditional Variety',
  'Premium red teff from North Shewa highlands. Rich in iron and nutrients. Traditional variety preferred by many for its distinct flavor. Well-dried and properly stored. Bulk discounts available for orders above 50 quintals.',
  200,
  'quintal',
  7200,
  'Debre Birhan area, near main highway',
  '2026-09-20',
  ARRAY[
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'
  ],
  'active'
),

-- COFFEE (Premium export crop)
(
  (SELECT id FROM users WHERE phone='0955555555'),
  (SELECT id FROM crops WHERE name_en='Coffee'),
  (SELECT id FROM regions WHERE name='SNNPR'),
  'Grade 1 Yirgacheffe Coffee - Washed',
  'Premium Arabica coffee from Gedeo Zone. Fully washed process, sun-dried on raised beds. Cupping score 88-90. Notes of bergamot, lemon, and black tea. Perfect for specialty roasters. ECX Grade 1 certified. Sample available for serious buyers.',
  50,
  'quintal',
  25000,
  'Yirgacheffe, Gedeo Zone - Famous coffee region',
  '2026-10-05',
  ARRAY[
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Coffee'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Sidamo Coffee Beans - Grade 2',
  'Quality Sidamo coffee, natural processed. Sweet and fruity flavor profile with good body. Grade 2 classification. Ideal for commercial roasting. Properly dried and hand-sorted. Ready for export or domestic market.',
  80,
  'quintal',
  18500,
  'Jimma Zone, Agaro area',
  '2026-09-28',
  ARRAY[
    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800'
  ],
  'active'
),

-- WHEAT (Staple grain)
(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Wheat'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Bread Wheat - Millennium Variety',
  'High-quality bread wheat, Millennium variety. Excellent for bread and pasta production. Protein content 12-13%, moisture 11%. Certified seed used for planting. Clean and properly stored. Suitable for mills and bakeries.',
  300,
  'quintal',
  5500,
  'Gondar, near Azezo area',
  '2026-08-25',
  ARRAY[
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
    'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0933333333'),
  (SELECT id FROM crops WHERE name_en='Wheat'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Durum Wheat - Export Grade',
  'Premium durum wheat for pasta making. Golden color, high gluten content. Export quality meeting international standards. Properly cleaned and graded. Pesticide residue test available. Bulk orders welcome.',
  180,
  'quintal',
  6200,
  'Arsi Zone, Tiyo Woreda',
  '2026-09-01',
  ARRAY[
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'
  ],
  'active'
),

-- MAIZE (Affordable staple)
(
  (SELECT id FROM users WHERE phone='0933333333'),
  (SELECT id FROM crops WHERE name_en='Maize'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Yellow Maize - BH-660 Hybrid',
  'Premium yellow hybrid maize from irrigated farm. Uniform kernel size, bright yellow color. Low moisture content (12%), aflatoxin tested and safe. Suitable for human consumption, animal feed, and industrial use. Large quantities available.',
  500,
  'quintal',
  3200,
  'Bako, West Shewa - Prime maize zone',
  '2026-10-10',
  ARRAY[
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800',
    'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0955555555'),
  (SELECT id FROM crops WHERE name_en='Maize'),
  (SELECT id FROM regions WHERE name='SNNPR'),
  'White Maize - Traditional Variety',
  'White maize preferred for making genfo and kolo. Fresh from harvest, well-dried and stored. No chemical treatment. Organic farming practices. Perfect for households and small-scale processors.',
  250,
  'quintal',
  2800,
  'Hawassa Zuria, near lake',
  '2026-10-08',
  ARRAY[
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800'
  ],
  'active'
),

-- CHICKPEA (Important pulse)
(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Chickpea'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Desi Chickpea - Premium for Shiro',
  'Small-seeded desi chickpea, dark brown color. Perfect for making traditional shiro powder. High protein content, excellent flavor. Cleaned and double-sorted. No stones or foreign matter. Ready for milling or export.',
  120,
  'quintal',
  7800,
  'West Shewa Zone, Ambo area',
  '2026-09-18',
  ARRAY[
    'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=800',
    'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Chickpea'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Kabuli Chickpea - Export Quality',
  'Large kabuli chickpea (8-9mm), cream color. Export grade meeting international standards. Perfect for hummus and salads. Properly cleaned and graded. ECX certification available. Sample upon request.',
  100,
  'quintal',
  9500,
  'North Shewa, Debre Birhan',
  '2026-09-22',
  ARRAY[
    'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=800'
  ],
  'active'
),

-- ONION (Popular vegetable)
(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Onion'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Red Onion - Bombay Variety',
  'Fresh red onions, Bombay variety. Medium to large bulbs (60-80mm). Good keeping quality, can store for 4-6 months. Pungent flavor perfect for Ethiopian cooking. Carefully harvested and cured. Available in 50kg mesh bags.',
  200,
  'quintal',
  4500,
  'Bahir Dar, Fogera Plain',
  '2026-10-12',
  ARRAY[
    'https://images.unsplash.com/photo-1587049352846-4a222e784587?w=800',
    'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=800'
  ],
  'active'
),

(
  (SELECT id FROM users WHERE phone='0933333333'),
  (SELECT id FROM crops WHERE name_en='Onion'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'White Onion - Fresh Harvest',
  'Premium white onions, sweet and mild flavor. Perfect for salads and light cooking. Just harvested, very fresh. Medium size (50-70mm). Limited quantity available. First come first served.',
  80,
  'quintal',
  5200,
  'East Shewa, Mojo area',
  '2026-10-15',
  ARRAY[
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'
  ],
  'active'
),

-- TOMATO (High demand vegetable)
(
  (SELECT id FROM users WHERE phone='0955555555'),
  (SELECT id FROM crops WHERE name_en='Tomato'),
  (SELECT id FROM regions WHERE name='SNNPR'),
  'Roma Tomatoes - Processing Grade',
  'Roma tomatoes ideal for paste and sauce making. Firm flesh, low water content, rich red color. Harvested at optimal ripeness. Perfect for processors and restaurants. Daily harvest available during season.',
  150,
  'quintal',
  3800,
  'Hawassa, irrigated farm',
  '2026-10-18',
  ARRAY[
    'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800',
    'https://images.unsplash.com/photo-1592924357229-8098c13e5cfc?w=800'
  ],
  'active'
),

-- POTATO (Staple vegetable)
(
  (SELECT id FROM users WHERE phone='0944444444'),
  (SELECT id FROM crops WHERE name_en='Potato'),
  (SELECT id FROM regions WHERE name='Amhara'),
  'Table Potato - Gudenie Variety',
  'High-quality table potatoes, Gudenie variety. Smooth skin, yellow flesh, excellent taste. Size 50-80mm. Perfect for frying, boiling, and mashing. No greening or defects. Stored in cool, dark conditions.',
  300,
  'quintal',
  4200,
  'Gojjam, Quarit area - Cool highlands',
  '2026-09-30',
  ARRAY[
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
    'https://images.unsplash.com/photo-1585759065152-3b0692e5b5c2?w=800'
  ],
  'active'
),

-- BANANA (Fruit crop)
(
  (SELECT id FROM users WHERE phone='0955555555'),
  (SELECT id FROM crops WHERE name_en='Banana'),
  (SELECT id FROM regions WHERE name='SNNPR'),
  'Dwarf Cavendish Bananas - Fresh',
  'Premium quality bananas from Rift Valley. Bright yellow, sweet taste, perfect ripeness. Size 15-18cm. Excellent for fresh consumption and juice. Harvested daily. Suitable for supermarkets and fruit vendors.',
  100,
  'quintal',
  3500,
  'Arba Minch, near lakes',
  '2026-10-19',
  ARRAY[
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
    'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800'
  ],
  'active'
),

-- HARICOT BEAN (Popular pulse)
(
  (SELECT id FROM users WHERE phone='0922222222'),
  (SELECT id FROM crops WHERE name_en='Haricot Bean'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'White Haricot Beans - Export Grade',
  'Premium white haricot beans (pinto). Large seeds (200-220 per 100g), uniform white color. Export quality meeting EU standards. Cleaned and sorted. Perfect for canning industry or direct export. Phytosanitary certificate available.',
  150,
  'quintal',
  8200,
  'East Shewa Zone, Adami Tulu',
  '2026-09-12',
  ARRAY[
    'https://images.unsplash.com/photo-1596797882870-6d3a0c2f7eee?w=800'
  ],
  'active'
),

-- SESAME (Export oilseed)
(
  (SELECT id FROM users WHERE phone='0933333333'),
  (SELECT id FROM crops WHERE name_en='Sesame'),
  (SELECT id FROM regions WHERE name='Oromia'),
  'Humera Sesame - Premium White',
  'Premium Humera sesame, white variety. High oil content (52-54%), excellent quality. Cleaned and sun-dried. Export grade meeting international standards. Well-known in global markets. Sample testing available.',
  80,
  'quintal',
  12500,
  'West Wollega, Bambasi area',
  '2026-09-05',
  ARRAY[
    'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=800'
  ],
  'active'
);

-- ============================================================
-- ADD DEMO INQUIRIES FOR NEW LISTINGS
-- ============================================================

INSERT INTO inquiries (listing_id, buyer_id, quantity_wanted, offered_price, message, status) VALUES
(
  (SELECT id FROM listings WHERE title LIKE '%Premium White Teff%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0966666666'),
  50,
  8200,
  'Interested in purchasing 50 quintals. Can you deliver to Addis Ababa? Need quality certificate for verification.',
  'pending'
),
(
  (SELECT id FROM listings WHERE title LIKE '%Yirgacheffe Coffee%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0977777777'),
  20,
  NULL,
  'Looking for specialty coffee for my roastery. Can I get a sample first? Also need to visit the farm.',
  'pending'
),
(
  (SELECT id FROM listings WHERE title LIKE '%Yellow Maize%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0966666666'),
  200,
  3000,
  'Need large quantity for animal feed factory. Can you provide aflatoxin test results? Payment upon delivery.',
  'accepted'
),
(
  (SELECT id FROM listings WHERE title LIKE '%Red Onion%' LIMIT 1),
  (SELECT id FROM users WHERE phone='0988888888'),
  30,
  4300,
  'Want to purchase for my grocery store in Dire Dawa. How is the keeping quality?',
  'pending'
);

-- ============================================================
-- VERIFICATION SUMMARY
-- ============================================================

SELECT 'Enhanced seed data loaded successfully!' AS status;
SELECT COUNT(*) AS total_listings FROM listings;
SELECT COUNT(*) AS active_listings FROM listings WHERE status='active';
SELECT COUNT(*) AS listings_with_images FROM listings WHERE array_length(image_urls, 1) > 0;
SELECT COUNT(*) AS total_inquiries FROM inquiries;

-- Show price range
SELECT 
  MIN(price_per_unit) as min_price_ETB,
  MAX(price_per_unit) as max_price_ETB,
  ROUND(AVG(price_per_unit), 2) as avg_price_ETB
FROM listings;
