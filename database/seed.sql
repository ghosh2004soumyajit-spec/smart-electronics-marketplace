-- =============================================================================
-- SMART ELECTRONICS MARKETPLACE - SEED DATA (EXPANDED)
-- =============================================================================

-- 1. SEED USERS (Password for both: Password123! hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@electronics.com', '$2a$10$p6gY0/tUG1cPYvb0ky6YDOZxsOuvHrGQsoTXjFtOOEDcdwlZpYdlm', 'System Administrator', '+91 9876543210', 'ADMIN'),
('john.doe@example.com',  '$2a$10$p6gY0/tUG1cPYvb0ky6YDOZxsOuvHrGQsoTXjFtOOEDcdwlZpYdlm', 'John Doe',             '+91 9123456789', 'CUSTOMER');

-- 2. SEED CATEGORIES
INSERT INTO categories (id, name, slug, description, image_url, display_order) VALUES
(1, 'Air Conditioners', 'air-conditioners', 'Energy-efficient split & window ACs with smart inverter tech',
   '/images/products/ac-split.jpg', 1),
(2, 'Refrigerators',   'refrigerators',    'Single door, double door, and side-by-side smart refrigerators',
   '/images/products/fridge-double-door.jpg', 2),
(3, 'Washing Machines','washing-machines',  'Front load & top load fully automatic washing machines',
   '/images/products/washer-front-load.jpg', 3),
(4, 'Televisions',     'televisions',       '4K Ultra HD OLED, QLED, and Smart LED TVs',
   '/images/products/tv-oled.jpg', 4),
(5, 'Smartphones',     'smartphones',       'Latest 5G smartphones from top brands with flagship features',
   '/images/products/phone-galaxy.jpg', 5);

ALTER SEQUENCE categories_id_seq RESTART WITH 6;

-- 3. SEED BRANDS (expanded)
INSERT INTO brands (id, name, slug, logo_url) VALUES
(1,  'LG',       'lg',        'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'),
(2,  'Samsung',  'samsung',   'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80'),
(3,  'Sony',     'sony',      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=200&q=80'),
(4,  'Whirlpool','whirlpool', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=200&q=80'),
(5,  'Panasonic','panasonic', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80'),
(6,  'Voltas',   'voltas',    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=200&q=80'),
(7,  'Daikin',   'daikin',    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=200&q=80'),
(8,  'Blue Star','blue-star', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80'),
(9,  'Carrier',  'carrier',   'https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&w=200&q=80'),
(10, 'Lloyd',    'lloyd',     'https://images.unsplash.com/photo-1489171078254-c3365d6e359f?auto=format&fit=crop&w=200&q=80'),
(11, 'Godrej',   'godrej',    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=200&q=80'),
(12, 'Bosch',    'bosch',     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80'),
(13, 'Haier',    'haier',     'https://images.unsplash.com/photo-1575908539614-ff89490f4a78?auto=format&fit=crop&w=200&q=80'),
(14, 'IFB',      'ifb',       'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=200&q=80'),
(15, 'Xiaomi',   'xiaomi',    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80'),
(16, 'TCL',      'tcl',       'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=200&q=80'),
(17, 'OnePlus',  'oneplus',   'https://images.unsplash.com/photo-1574920162043-b872873f19c8?auto=format&fit=crop&w=200&q=80'),
(18, 'Realme',   'realme',    'https://images.unsplash.com/photo-1598327106026-d9521da673d1?auto=format&fit=crop&w=200&q=80'),
(19, 'Apple',    'apple',     'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=200&q=80'),
(20, 'POCO',     'poco',      'https://images.unsplash.com/photo-1609252926473-3b47d93d0745?auto=format&fit=crop&w=200&q=80');

ALTER SEQUENCE brands_id_seq RESTART WITH 21;

-- 4. SEED PRODUCTS
-- All specs keys match the frontend facet keys exactly so filters work.
-- Spec key conventions:
--   ACs:       tonnage, ac_type, energy_rating (as string), inverter (Yes/No), star_rating (int)
--   Fridges:   capacity_l (num), capacity_bucket, door_type, energy_rating, inverter_compressor (Yes/No), cooling (Frost-Free/Direct Cool)
--   Washers:   capacity_kg (num), load_type, energy_rating, inverter (Yes/No), rpm (num)
--   TVs:       screen_size_inch (num), screen_bucket, resolution, panel, refresh_rate_hz (num), smart_os
--   Phones:    ram_gb (num), storage_gb (num), battery_mah (num), camera_mp (num), display_type (AMOLED/LCD), processor

INSERT INTO products (id, title, slug, category_id, brand_id, model_number, base_price, discount_price, is_featured, specs, description) VALUES

-- ═══════════════════════════════ AIR CONDITIONERS (1 - 7) ═══════════════════════════════

(1,  'Voltas 1.5 Ton 5 Star Inverter Split AC',
     'voltas-1-5-ton-5-star-inverter-split-ac', 1, 6, 'VS18V5',
     62990.00, 44990.00, TRUE,
     '{"tonnage":"1.5","ac_type":"Split","energy_rating":"5","star_rating":5,"inverter":"Yes","room_size_sqft":180,"copper_condenser":true,"noise_db":32,"warranty_years":10}'::jsonb,
     'A 5-star inverter split unit sized for standard Indian bedrooms. Copper condenser with anti-corrosion coating and stabiliser-free operating range down to 150 V.'),

(2,  'Daikin 1.5 Ton 3 Star Inverter Split AC',
     'daikin-1-5-ton-3-star-inverter-split-ac', 1, 7, 'FTKF50TV',
     48990.00, 38490.00, FALSE,
     '{"tonnage":"1.5","ac_type":"Split","energy_rating":"3","star_rating":3,"inverter":"Yes","room_size_sqft":170,"copper_condenser":true,"noise_db":34,"warranty_years":10}'::jsonb,
     'Japanese compressor engineering with coanda airflow pattern that throws air up to 15 m along the ceiling. PM 2.5 filter included.'),

(3,  'LG 1 Ton 4 Star Dual Inverter Split AC',
     'lg-1-ton-4-star-inverter-split-ac', 1, 1, 'PS-Q12YNZE',
     43990.00, 32990.00, FALSE,
     '{"tonnage":"1.0","ac_type":"Split","energy_rating":"4","star_rating":4,"inverter":"Yes","room_size_sqft":110,"copper_condenser":true,"noise_db":28,"warranty_years":10}'::jsonb,
     'A compact-bedroom unit with LG dual-inverter compressor, 4-way swing, and ocean-black corrosion protection for coastal areas.'),

(4,  'Samsung 1.5 Ton 5 Star Wind-Free Inverter AC',
     'samsung-1-5-ton-5-star-windfree-inverter-ac', 1, 2, 'AR18CY5ANWK',
     67990.00, 52990.00, TRUE,
     '{"tonnage":"1.5","ac_type":"Split","energy_rating":"5","star_rating":5,"inverter":"Yes","room_size_sqft":180,"copper_condenser":true,"noise_db":31,"warranty_years":10}'::jsonb,
     'Wind-Free mode maintains temperature without direct airflow through 27,000 micro-holes — no cold drafts at 2 am. Works with SmartThings app.'),

(5,  'Blue Star 1 Ton 3 Star Fixed-Speed Split AC',
     'blue-star-1-ton-3-star-fixed-speed-split-ac', 1, 8, 'BS-12CNHH',
     36500.00, 27990.00, FALSE,
     '{"tonnage":"1.0","ac_type":"Split","energy_rating":"3","star_rating":3,"inverter":"No","room_size_sqft":110,"copper_condenser":true,"noise_db":40,"warranty_years":5}'::jsonb,
     'Fixed-speed workhorse for rooms used a few hours a day. Turbo cool pulls the room down fast; dust filter is washable.'),

(6,  'Carrier 2 Ton 4 Star Inverter Split AC',
     'carrier-2-ton-4-star-inverter-split-ac', 1, 9, 'CAI24ER3N8F0',
     74990.00, 58990.00, FALSE,
     '{"tonnage":"2.0","ac_type":"Split","energy_rating":"4","star_rating":4,"inverter":"Yes","room_size_sqft":240,"copper_condenser":true,"noise_db":37,"warranty_years":10}'::jsonb,
     'Big-room unit with flexi-cool modes and high-ambient design tested to 52°C. Self-diagnostic shows fault codes on the display.'),

(7,  'Lloyd 1.5 Ton 3 Star Window AC',
     'lloyd-1-5-ton-3-star-window-ac', 1, 10, 'GLW18B3YWSEI',
     38990.00, 29490.00, FALSE,
     '{"tonnage":"1.5","ac_type":"Window","energy_rating":"3","star_rating":3,"inverter":"No","room_size_sqft":160,"copper_condenser":true,"noise_db":48,"warranty_years":5}'::jsonb,
     'One box, one wall opening, no installer drama. Cheapest route to 1.5-ton cooling. Fits a standard 1.5 ft x 1.5 ft sleeve.'),

-- ═══════════════════════════════ REFRIGERATORS (8 - 13) ═══════════════════════════════

(8,  'LG 260 L Frost-Free Double Door Refrigerator',
     'lg-260-l-frost-free-double-door', 2, 1, 'GL-T292SPZX',
     35990.00, 27490.00, TRUE,
     '{"capacity_l":260,"capacity_bucket":"200-300 L","door_type":"Double Door","energy_rating":"4","star_rating":4,"inverter_compressor":"Yes","cooling":"Frost-Free","warranty_years":10}'::jsonb,
     'Smart inverter compressor holds ±0.5°C — produce lasts noticeably longer. Door-cooling+ blows cold air from the top so door-shelf items chill equally.'),

(9,  'Samsung 322 L Frost-Free Double Door Refrigerator',
     'samsung-322-l-frost-free-double-door', 2, 2, 'RT34CB56228',
     42990.00, 32990.00, FALSE,
     '{"capacity_l":322,"capacity_bucket":"300-400 L","door_type":"Double Door","energy_rating":"3","star_rating":3,"inverter_compressor":"Yes","cooling":"Frost-Free","warranty_years":10}'::jsonb,
     'Twin Cooling keeps fridge and freezer air separate. Convertible 5-in-1 modes let the freezer run as extra fridge space during festivals.'),

(10, 'Whirlpool 200 L Direct-Cool Single Door Refrigerator',
     'whirlpool-200-l-direct-cool-single-door', 2, 4, 'WDE205CLS3',
     21990.00, 16490.00, FALSE,
     '{"capacity_l":200,"capacity_bucket":"200-300 L","door_type":"Single Door","energy_rating":"3","star_rating":3,"inverter_compressor":"No","cooling":"Direct Cool","warranty_years":10}'::jsonb,
     'For 1–2 people or a second fridge. Runs on an inverter during cuts — 9 hr cooling retention claimed. Direct cool, simple and affordable.'),

(11, 'Godrej 185 L Direct-Cool Single Door Refrigerator',
     'godrej-185-l-direct-cool-single-door', 2, 11, 'RD CHAMP 200B',
     17490.00, 13290.00, FALSE,
     '{"capacity_l":185,"capacity_bucket":"Under 200 L","door_type":"Single Door","energy_rating":"2","star_rating":2,"inverter_compressor":"No","cooling":"Direct Cool","warranty_years":10}'::jsonb,
     'The entry point of refrigeration in India, made well. Thick PUF insulation holds temperature through power cuts, and the vegetable crisper is sized for a real weekly haul.'),

(12, 'Bosch 347 L Bottom-Mount Refrigerator',
     'bosch-347-l-bottom-mount-refrigerator', 2, 12, 'KMB34VW30I',
     52990.00, 41990.00, FALSE,
     '{"capacity_l":347,"capacity_bucket":"300-400 L","door_type":"Bottom Mount","energy_rating":"4","star_rating":4,"inverter_compressor":"Yes","cooling":"Frost-Free","warranty_years":10}'::jsonb,
     'Bottom-mount puts the section you open 20 times a day at eye level. VitaFresh maintains humidity for produce; inverter compressor runs at 38 dB.'),

(13, 'Haier 540 L Side-by-Side Refrigerator',
     'haier-540-l-side-by-side-refrigerator', 2, 13, 'HRB-550SS',
     72990.00, 54990.00, FALSE,
     '{"capacity_l":540,"capacity_bucket":"Above 400 L","door_type":"Side-by-Side","energy_rating":"3","star_rating":3,"inverter_compressor":"Yes","cooling":"Frost-Free","warranty_years":10}'::jsonb,
     'Full-width shelves for large households. Holiday mode runs the fridge near-empty while you travel. Requires ~4 ft of wall plus hinge clearance.'),

-- ═══════════════════════════════ WASHING MACHINES (14 - 19) ═══════════════════════════════

(14, 'IFB 7 kg Front-Load Washing Machine',
     'ifb-7-kg-front-load-washing-machine', 3, 14, 'SENATOR-WXSN',
     35900.00, 27990.00, TRUE,
     '{"capacity_kg":7.0,"load_type":"Front Load","energy_rating":"5","star_rating":5,"inverter":"No","rpm":1200,"warranty_years":4}'::jsonb,
     'Aqua énergie treats hard water so detergent lathers properly. 1200 RPM spin leaves clothes damp rather than soaked, cutting drying time significantly.'),

(15, 'LG 6.5 kg Top-Load Inverter Washing Machine',
     'lg-6-5-kg-top-load-inverter-washing-machine', 3, 1, 'T65SKSF1Z',
     23990.00, 17490.00, FALSE,
     '{"capacity_kg":6.5,"load_type":"Top Load","energy_rating":"5","star_rating":5,"inverter":"Yes","rpm":700,"warranty_years":10}'::jsonb,
     'TurboDrum spins the drum and pulsator in opposite directions for a harder wash without shredding fabric. Works on low water pressure.'),

(16, 'Samsung 8 kg Front-Load EcoBubble Washing Machine',
     'samsung-8-kg-front-load-ecobubble', 3, 2, 'WW80T504DTT',
     43900.00, 33490.00, TRUE,
     '{"capacity_kg":8.0,"load_type":"Front Load","energy_rating":"5","star_rating":5,"inverter":"Yes","rpm":1400,"warranty_years":10}'::jsonb,
     'EcoBubble saves heater energy on most loads; hygiene steam cycles remain for bedsheets and baby clothes. 8 kg handles a full weekly wash.'),

(17, 'Bosch 7 kg Series 4 Front-Load Washing Machine',
     'bosch-7-kg-series-4-front-load', 3, 12, 'WAJ24267IN',
     38990.00, 29990.00, FALSE,
     '{"capacity_kg":7.0,"load_type":"Front Load","energy_rating":"5","star_rating":5,"inverter":"Yes","rpm":1200,"warranty_years":10}'::jsonb,
     'EcoSilence drive uses magnets instead of brushes. VarioDrum adjusts paddle shape for delicate vs heavy loads. 47 dB wash cycle — the quietest in class.'),

(18, 'Whirlpool 6 kg Top-Load Washing Machine',
     'whirlpool-6-kg-top-load-washing-machine', 3, 4, 'WHITEMAGIC-6',
     18400.00, 13990.00, FALSE,
     '{"capacity_kg":6.0,"load_type":"Top Load","energy_rating":"3","star_rating":3,"inverter":"No","rpm":740,"warranty_years":5}'::jsonb,
     'ZPF technology fills the tub even at 17 Pa low pressure. Hard-water wash adapts the cycle for borewell water. Simple dial, no app, no nonsense.'),

(19, 'Godrej 5.8 kg Top-Load Washing Machine',
     'godrej-5-8-kg-top-load-washing-machine', 3, 11, 'WT EON 580',
     14990.00, 10490.00, FALSE,
     '{"capacity_kg":5.8,"load_type":"Top Load","energy_rating":"3","star_rating":3,"inverter":"No","rpm":700,"warranty_years":10}'::jsonb,
     'Smallest family washer in the catalog. Footprint is 15% smaller than typical 6.5 kg machines. Child lock and unbalance detection are standard.'),

-- ═══════════════════════════════ TELEVISIONS (20 - 25) ═══════════════════════════════

(20, 'Xiaomi 55 Inch 4K QLED Smart TV',
     'xiaomi-55-inch-4k-qled-tv', 4, 15, 'L55M8-A2IN',
     49999.00, 32999.00, TRUE,
     '{"screen_size_inch":55,"screen_inches":55,"screen_bucket":"50-55 inch","resolution":"4K Ultra HD","panel":"QLED","refresh_rate_hz":60,"smart_os":"Google TV","hdr":true,"warranty_years":2}'::jsonb,
     'QLED colour at LED money. 94% DCI-P3. Google TV with a quad-A73 chip. Dolby Vision + HDR10+, 30W speakers with eARC for a soundbar later.'),

(21, 'Samsung 43 Inch Crystal 4K Smart TV',
     'samsung-43-inch-crystal-4k-tv', 4, 2, 'UA43CU7700KLXL',
     39900.00, 27490.00, FALSE,
     '{"screen_size_inch":43,"screen_inches":43,"screen_bucket":"43 inch","resolution":"4K Ultra HD","panel":"LED","refresh_rate_hz":60,"smart_os":"Tizen","hdr":true,"warranty_years":1}'::jsonb,
     'Crystal processor upscales 1080p streaming cleanly. AirSlim panel is 2.5 cm deep. Solar-charging remote: no more AAA battery hunts.'),

(22, 'LG 65 Inch OLED evo 4K Smart TV',
     'lg-65-inch-oled-evo-tv', 4, 1, 'OLED65C3PSA',
     169990.00, 124990.00, TRUE,
     '{"screen_size_inch":65,"screen_inches":65,"screen_bucket":"65 inch+","resolution":"4K Ultra HD","panel":"OLED","refresh_rate_hz":120,"smart_os":"webOS","hdr":true,"warranty_years":1}'::jsonb,
     'OLED evo runs brighter than earlier OLEDs. α9 processor, 120 Hz native for consoles, four full-bandwidth HDMI 2.1 ports. WebOS with five years of upgrade promises.'),

(23, 'Sony BRAVIA 55 Inch 4K LED Smart TV',
     'sony-bravia-55-inch-4k-led-tv', 4, 3, 'KD-55X74L',
     89900.00, 64990.00, FALSE,
     '{"screen_size_inch":55,"screen_inches":55,"screen_bucket":"50-55 inch","resolution":"4K Ultra HD","panel":"LED","refresh_rate_hz":60,"smart_os":"Google TV","hdr":true,"warranty_years":1}'::jsonb,
     'Sony X1 processor and Motionflow XR 240 keep fast action clean. Acoustic auto calibration adjusts sound to your room. Google TV with no preinstalled bloat.'),

(24, 'TCL 32 Inch HD Ready Android TV',
     'tcl-32-inch-hd-android-tv', 4, 16, '32S5400A',
     18990.00, 11999.00, FALSE,
     '{"screen_size_inch":32,"screen_inches":32,"screen_bucket":"32 inch","resolution":"HD Ready","panel":"LED","refresh_rate_hz":60,"smart_os":"Android TV","hdr":false,"warranty_years":1}'::jsonb,
     'HD Ready is the right resolution at 32 inch. Android TV with Chromecast built in. 2x8W speakers adequate for the room sizes this TV serves.'),

(25, 'OnePlus 43 Inch 4K Y-Series Smart TV',
     'oneplus-43-inch-4k-y-series-tv', 4, 17, '43Y1S Pro',
     31999.00, 23999.00, FALSE,
     '{"screen_size_inch":43,"screen_inches":43,"screen_bucket":"43 inch","resolution":"4K Ultra HD","panel":"LED","refresh_rate_hz":60,"smart_os":"Google TV","hdr":true,"warranty_years":1}'::jsonb,
     'OnePlus keeps the software experience ad-free, which no budget rival can claim. 4K HDR10+, 24W speakers. OxygenPlay remote works over Bluetooth.'),

-- ═══════════════════════════════ SMARTPHONES (26 - 31) ═══════════════════════════════

(26, 'Samsung Galaxy A55 5G (8 GB / 256 GB)',
     'samsung-galaxy-a55-5g', 5, 2, 'SM-A556E',
     39999.00, 29999.00, FALSE,
     '{"ram_gb":8,"storage_gb":256,"battery_mah":5000,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":50,"processor":"Exynos 1480","warranty_years":1}'::jsonb,
     'Metal frame, 4 years of OS updates. Super AMOLED at 120 Hz, 5000 mAh, IP67 dust/water resistance. Samsung commits to 4 OS + 5 security years.'),

(27, 'OnePlus Nord CE4 5G (8 GB / 128 GB)',
     'oneplus-nord-ce4-5g', 5, 17, 'CPH2613',
     27999.00, 22999.00, FALSE,
     '{"ram_gb":8,"storage_gb":128,"battery_mah":5500,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":50,"processor":"Snapdragon 7 Gen 3","warranty_years":1}'::jsonb,
     '100W charging: 0–50% in ~10 minutes. The charger is in the box. Snapdragon 7 Gen 3, AMOLED 120 Hz, OxygenOS without duplicate-app clutter.'),

(28, 'Xiaomi Redmi Note 13 Pro 5G (8 GB / 256 GB)',
     'redmi-note-13-pro-5g', 5, 15, '23116RA7EO',
     27999.00, 21999.00, TRUE,
     '{"ram_gb":8,"storage_gb":256,"battery_mah":5100,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":200,"processor":"Snapdragon 7s Gen 2","warranty_years":1}'::jsonb,
     '200 MP main sensor with OIS under ₹22,000. 1.5K AMOLED 120 Hz. 5100 mAh with 67W charging. Headphone jack retained.'),

(29, 'Realme 12 Pro+ 5G (8 GB / 256 GB)',
     'realme-12-pro-plus-5g', 5, 18, 'RMX3840',
     31999.00, 24999.00, FALSE,
     '{"ram_gb":8,"storage_gb":256,"battery_mah":5000,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":50,"processor":"Snapdragon 7s Gen 2","warranty_years":1}'::jsonb,
     'A real 3× periscope zoom — the only one near this price. Paired with a 50 MP Sony main sensor and curved AMOLED display.'),

(30, 'Apple iPhone 15 (128 GB)',
     'apple-iphone-15-128gb', 5, 19, 'MLPF3HN/A',
     79900.00, 56900.00, TRUE,
     '{"ram_gb":6,"storage_gb":128,"battery_mah":3349,"battery_bucket":"Under 5000 mAh","display_type":"AMOLED","camera_mp":48,"processor":"A16 Bionic","warranty_years":1}'::jsonb,
     'USB-C at last. A16 Bionic, 48 MP main with 2× optical crop, Dynamic Island. Holds ~55% resale value after two years — the highest of any phone in this catalog.'),

(31, 'POCO X6 Pro 5G (12 GB / 256 GB)',
     'poco-x6-pro-5g', 5, 20, '23122PCD1I',
     29999.00, 22999.00, FALSE,
     '{"ram_gb":12,"storage_gb":256,"battery_mah":5000,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":64,"processor":"Dimensity 8300-Ultra","warranty_years":1}'::jsonb,
     'Dimensity 8300-Ultra scores above last year''s flagships. 12 GB RAM standard. 144 Hz AMOLED. The performance-per-rupee champion.'),

-- ═══════════════════════════════ EXPANDED PRODUCTS (32 - 40) ═══════════════════════════════

(32, 'LG 1.5 Ton 5 Star Dual Inverter Split AC',
     'lg-1-5-ton-5-star-dual-inverter-split-ac', 1, 1, 'PS-Q18YNZE',
     65990.00, 47990.00, TRUE,
     '{"tonnage":"1.5","ac_type":"Split","energy_rating":"5","star_rating":5,"inverter":"Yes","room_size_sqft":180,"copper_condenser":true,"noise_db":26,"warranty_years":10}'::jsonb,
     'AI Convertible 6-in-1 Cooling, HD Filter with Anti-Virus Protection, and 100% Copper Condenser. Whisper-quiet at 26 dB.'),

(33, 'Samsung 653 L 3 Star Side-by-Side Refrigerator',
     'samsung-653l-3star-side-by-side', 2, 2, 'RS76CG8003S9',
     112900.00, 82990.00, TRUE,
     '{"capacity_l":653,"capacity_bucket":"Above 400 L","door_type":"Side-by-Side","energy_rating":"3","star_rating":3,"inverter_compressor":"Yes","cooling":"Frost-Free","warranty_years":20}'::jsonb,
     'Samsung Smart Convertible 5-in-1 Side by Side Refrigerator with Twin Cooling Plus and Wi-Fi embedded. Premium choice for large families.'),

(34, 'LG 8 kg 5 Star AI Direct Drive Front-Load Washing Machine',
     'lg-8kg-5star-ai-direct-drive-front-load', 3, 1, 'FHD0805STW',
     48990.00, 36990.00, TRUE,
     '{"capacity_kg":8.0,"load_type":"Front Load","energy_rating":"5","star_rating":5,"inverter":"Yes","rpm":1400,"warranty_years":10}'::jsonb,
     'AI DD Intelligent Care, 6 Motion Direct Drive, Steam Hygiene Wash, and Wi-Fi SmartThinQ. Detects fabric type and chooses the right wash motion.'),

(35, 'Samsung 55 Inch QLED 4K Smart TV',
     'samsung-55-inch-qled-4k-smart-tv', 4, 2, 'QA55Q70CAKLXL',
     79900.00, 57990.00, TRUE,
     '{"screen_size_inch":55,"screen_inches":55,"screen_bucket":"50-55 inch","resolution":"4K Ultra HD","panel":"QLED","refresh_rate_hz":120,"smart_os":"Tizen","hdr":true,"warranty_years":1}'::jsonb,
     'Quantum dot colour, 120 Hz for gaming, and motion-rate 240 for sport. Alexa built-in. Slim-fit wall mount keeps the panel flush to the wall.'),

(36, 'Sony BRAVIA 65 Inch OLED 4K Smart TV',
     'sony-bravia-65-inch-oled-4k-smart-tv', 4, 3, 'XR-65A80L',
     174900.00, 139990.00, TRUE,
     '{"screen_size_inch":65,"screen_inches":65,"screen_bucket":"65 inch+","resolution":"4K Ultra HD","panel":"OLED","refresh_rate_hz":120,"smart_os":"Google TV","hdr":true,"warranty_years":2}'::jsonb,
     'Sony BRAVIA XR OLED with Cognitive Processor XR, Acoustic Surface Audio+, and XR Clear Image. The benchmark for premium TV in India.'),

(37, 'Samsung Galaxy S24 5G (8 GB / 256 GB)',
     'samsung-galaxy-s24-5g', 5, 2, 'SM-S921B',
     74999.00, 54999.00, TRUE,
     '{"ram_gb":8,"storage_gb":256,"battery_mah":4000,"battery_bucket":"Under 5000 mAh","display_type":"AMOLED","camera_mp":50,"processor":"Exynos 2400","warranty_years":1}'::jsonb,
     'Galaxy AI features, Snapdragon 8 Gen 3 (or Exynos 2400), 7 years of OS updates. ProVisual Engine for photography that genuinely impresses.'),

(38, 'Apple iPhone 15 Pro (256 GB)',
     'apple-iphone-15-pro-256gb', 5, 19, 'MTQC3HN/A',
     134900.00, 109900.00, TRUE,
     '{"ram_gb":8,"storage_gb":256,"battery_mah":3274,"battery_bucket":"Under 5000 mAh","display_type":"AMOLED","camera_mp":48,"processor":"A17 Pro","warranty_years":1}'::jsonb,
     'Titanium design, A17 Pro chip, 3× telephoto with 3D sensor shift OIS. USB 3 speeds, Action button, ProRes video at 4K 60fps.'),

(39, 'OnePlus 12 5G (12 GB / 256 GB)',
     'oneplus-12-5g', 5, 17, 'CPH2573',
     64999.00, 52999.00, FALSE,
     '{"ram_gb":12,"storage_gb":256,"battery_mah":5400,"battery_bucket":"5000 mAh+","display_type":"AMOLED","camera_mp":50,"processor":"Snapdragon 8 Gen 3","warranty_years":1}'::jsonb,
     '100W wired + 50W wireless charging. Hasselblad camera system with periscope telephoto. Snapdragon 8 Gen 3 with 12 GB LPDDR5X RAM.'),

(40, 'Xiaomi 14 5G (12 GB / 512 GB)',
     'xiaomi-14-5g', 5, 15, '24028PN60G',
     69999.00, 59999.00, FALSE,
     '{"ram_gb":12,"storage_gb":512,"battery_mah":4610,"battery_bucket":"Under 5000 mAh","display_type":"AMOLED","camera_mp":50,"processor":"Snapdragon 8 Gen 3","warranty_years":1}'::jsonb,
     'Leica camera partnership with Summilux optics. Snapdragon 8 Gen 3, 90W HyperCharge. IP68 rated, ceramic or vegan leather back.');

ALTER SEQUENCE products_id_seq RESTART WITH 41;

-- 5. SEED PRODUCT IMAGES
INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES
-- Air Conditioners (1-7)
(1,  '/images/products/ac-split.jpg',            TRUE,  1),
(2,  '/images/products/ac-split.jpg',            TRUE,  1),
(3,  '/images/products/ac-split.jpg',            TRUE,  1),
(4,  '/images/products/ac-windfree.jpg',         TRUE,  1),
(5,  '/images/products/ac-split.jpg',            TRUE,  1),
(6,  '/images/products/ac-split.jpg',            TRUE,  1),
(7,  '/images/products/ac-window.jpg',           TRUE,  1),
-- Refrigerators (8-13)
(8,  '/images/products/fridge-double-door.jpg',  TRUE,  1),
(9,  '/images/products/fridge-double-door.jpg',  TRUE,  1),
(10, '/images/products/fridge-single-door.jpg',  TRUE,  1),
(11, '/images/products/fridge-single-door.jpg',  TRUE,  1),
(12, '/images/products/fridge-bottom-mount.jpg', TRUE,  1),
(13, '/images/products/fridge-side-by-side.jpg', TRUE,  1),
-- Washing Machines (14-19)
(14, '/images/products/washer-front-load.jpg',   TRUE,  1),
(15, '/images/products/washer-top-load.jpg',     TRUE,  1),
(16, '/images/products/washer-front-load.jpg',   TRUE,  1),
(17, '/images/products/washer-front-load.jpg',   TRUE,  1),
(18, '/images/products/washer-top-load.jpg',     TRUE,  1),
(19, '/images/products/washer-top-load.jpg',     TRUE,  1),
-- Televisions (20-25)
(20, '/images/products/tv-qled.jpg',             TRUE,  1),
(21, '/images/products/tv-qled.jpg',             TRUE,  1),
(22, '/images/products/tv-oled.jpg',             TRUE,  1),
(23, '/images/products/tv-qled.jpg',             TRUE,  1),
(24, '/images/products/tv-qled.jpg',             TRUE,  1),
(25, '/images/products/tv-qled.jpg',             TRUE,  1),
-- Smartphones (26-31)
(26, '/images/products/phone-galaxy.jpg',        TRUE,  1),
(27, '/images/products/phone-android.jpg',       TRUE,  1),
(28, '/images/products/phone-xiaomi.jpg',        TRUE,  1),
(29, '/images/products/phone-android.jpg',       TRUE,  1),
(30, '/images/products/phone-iphone.jpg',        TRUE,  1),
(31, '/images/products/phone-xiaomi.jpg',        TRUE,  1),
-- Expanded Products (32-40)
(32, '/images/products/ac-split.jpg',            TRUE,  1),
(33, '/images/products/fridge-side-by-side.jpg', TRUE,  1),
(34, '/images/products/washer-front-load.jpg',   TRUE,  1),
(35, '/images/products/tv-qled.jpg',             TRUE,  1),
(36, '/images/products/tv-oled.jpg',             TRUE,  1),
(37, '/images/products/phone-galaxy.jpg',        TRUE,  1),
(38, '/images/products/phone-iphone.jpg',        TRUE,  1),
(39, '/images/products/phone-android.jpg',       TRUE,  1),
(40, '/images/products/phone-xiaomi.jpg',        TRUE,  1);

-- 6. SEED INVENTORY
INSERT INTO inventory (product_id, stock_quantity, reserved_quantity) VALUES
(1, 24, 2), (2, 18, 0), (3, 31, 1), (4, 12, 0), (5, 26, 0), (6,  9, 0), (7, 15, 0),
(8, 40, 2), (9, 22, 0), (10, 35, 1), (11, 44, 0), (12, 11, 0), (13, 7, 0),
(14, 19, 1), (15, 28, 0), (16, 14, 0), (17, 10, 0), (18, 33, 0), (19, 21, 0),
(20, 17, 0), (21, 25, 0), (22, 5, 1), (23, 8, 0), (24, 52, 0), (25, 20, 0),
(26, 30, 2), (27, 38, 0), (28, 46, 3), (29, 16, 0), (30, 13, 1), (31, 22, 0),
(32, 20, 1), (33, 8, 0), (34, 16, 0), (35, 13, 0), (36, 6, 1),
(37, 9, 0), (38, 7, 0), (39, 11, 0), (40, 8, 0);

-- 7. SEED DELIVERY ZONES
INSERT INTO delivery_zones (pincode, city, state, is_serviceable, delivery_charge, min_days, max_days) VALUES
('110001', 'New Delhi',  'Delhi',         TRUE, 0.00,   1, 2),
('400001', 'Mumbai',     'Maharashtra',   TRUE, 0.00,   2, 3),
('560001', 'Bengaluru',  'Karnataka',     TRUE, 0.00,   1, 3),
('600001', 'Chennai',    'Tamil Nadu',    TRUE, 150.00, 3, 5),
('700001', 'Kolkata',    'West Bengal',   TRUE, 150.00, 3, 5),
('500001', 'Hyderabad',  'Telangana',     TRUE, 0.00,   2, 4),
('380001', 'Ahmedabad',  'Gujarat',       TRUE, 99.00,  2, 4),
('411001', 'Pune',       'Maharashtra',   TRUE, 0.00,   2, 3),
('302001', 'Jaipur',     'Rajasthan',     TRUE, 99.00,  3, 5),
('452001', 'Indore',     'Madhya Pradesh',TRUE, 99.00,  3, 5);

-- 8. SEED OFFERS (Supporting all 5 requested coupon codes)
INSERT INTO offers (code, title, description, discount_percent, max_discount, min_order_amount, is_active) VALUES
('FESTIVE10',  'Festive Special 10% Off',  'Get 10% discount on all electronics up to ₹5,000', 10.00, 5000.00, 10000.00, TRUE),
('WELCOME5',   'Welcome New User 5% Off',  'Flat 5% off on your first order up to ₹2,000',       5.00, 2000.00,  2000.00, TRUE),
('SAVE15',     'Super Saver 15% Off',      '15% off on orders above ₹50,000 up to ₹8,000 off', 15.00, 8000.00, 50000.00, TRUE),
('VOLT10',     'VoltHaus Special 10% Off', '10% discount on electronics up to ₹2,000',          10.00, 2000.00,  1000.00, TRUE),
('WELCOME500', 'Welcome Flat ₹500 Off',    'Flat ₹500 off on your first order above ₹5,000',   100.00,  500.00,  5000.00, TRUE);

-- 9. SEED REVIEWS
INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES
(1,  2, 5, 'Super fast cooling!',          'Cools down my 180 sq.ft room in under 10 minutes. Extremely silent operation at night.'),
(8,  2, 4, 'Spacious & whisper quiet',     'Great double door fridge with smart cooling controls. Fits all weekly groceries easily.'),
(14, 2, 5, 'Aqua énergie matters',         'We have hard borewell water and clothes come out soft. The 4-year warranty convinced us over LG.'),
(20, 2, 5, 'Outstanding picture quality',    'The QLED colours are vibrant and accurate. Setup was simple, Google TV is smooth.'),
(27, 2, 5, '0 to 60% while I shower',      'Snapdragon chip plays BGMI at high without frying. Charger in box, unlike certain brands.'),
(28, 2, 5, '200MP is no joke',             'Photos are incredibly detailed. The 67W charging is a lifesaver for long days.'),
(30, 2, 4, 'Premium feel, great camera',   'The camera system is exceptional. Battery life is okay for a full day of moderate use.');

