-- ============================================================
-- WEARHUB — SEED DATA
-- Run AFTER schema.sql, and AFTER creating test users via
-- Supabase Auth (Dashboard → Authentication → Users → Add user)
-- Then replace the UUIDs below with real user IDs.
-- ============================================================

-- ─── Instructions ────────────────────────────────────────────────────────────
-- 1. Create test users in Supabase Auth dashboard
-- 2. Copy their UUIDs into the DO block below
-- 3. Run this script in SQL editor

do $$
declare
  -- Replace with real user UUIDs from auth.users
  uid_sean    uuid := '00000000-0000-0000-0000-000000000001';
  uid_mikkel  uuid := '00000000-0000-0000-0000-000000000002';
  uid_oscar   uuid := '00000000-0000-0000-0000-000000000003';
  uid_rasmus  uuid := '00000000-0000-0000-0000-000000000004';
  uid_frederik uuid := '00000000-0000-0000-0000-000000000005';

  -- Product IDs
  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();
  p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid();
  p8 uuid := gen_random_uuid();

begin

-- Profiles
insert into public.profiles (id, username, display_name, bio, location, is_verified, response_rate)
values
  (uid_sean,     'seanf',           'Sean F.',      'Streetwear-nørd med svaghed for arkiv-pieces.',    'København K', true,  96),
  (uid_mikkel,   'nikekid_cph',     'Mikkel H.',    'Sneaker-samler siden 2018. Alt med boks.',          'København N', true,  98),
  (uid_oscar,    'supreme_sthlm',   'Oscar L.',     'Professionel reseller. Hurtig sending.',            'Stockholm',   true,  99),
  (uid_rasmus,   'palace_fan',      'Rasmus K.',    null,                                                'Odense',      false, 85),
  (uid_frederik, 'stone_island_dk', 'Frederik B.',  'Primært Stone Island og CP Company.',              'København Ø', true,  97)
on conflict (id) do nothing;

-- Products
insert into public.products
  (id, seller_id, title, description, brand, category, size, condition,
   price, original_retail_price, is_drop, is_verified, status)
values
  (p1, uid_mikkel,
   'Air Jordan 1 Retro High OG Chicago',
   'Ikonisk colorway fra 1985. Brugt få gange indendørs. Boks og kvittering medfølger.',
   'Nike', 'Sneakers', 'US 10 / EU 44', 'SOM NY', 4299, 1399, true, true, 'active'),

  (p2, uid_mikkel,
   'Yeezy Boost 350 V2 Zebra',
   'Klassisk drop fra Kanye-æraen. Brugt 3–4 gange. Original boks medfølger.',
   'Adidas', 'Sneakers', 'EU 44', 'GOD', 2199, 1999, true, true, 'active'),

  (p3, uid_oscar,
   'Supreme Box Logo Hoodie FW22',
   'Aldrig vasket, aldrig båret. Straight from the drop. Stadig i original plastik.',
   'Supreme', 'Hoodies', 'L', 'NY', 3499, 1600, true, true, 'active'),

  (p4, uid_rasmus,
   'Palace Tri-Ferg Tee',
   'OG Palace tee fra SS21. Brugt et par gange og vasket, holder farven godt.',
   'Palace', 'T-Shirts', 'M', 'GOD', 699, 650, false, true, 'active'),

  (p5, uid_frederik,
   'Stone Island Ghost Piece Jacket',
   'Eksklusiv Ghost Piece. Dustbag medfølger. To sæsoner brugt let.',
   'Stone Island', 'Outerwear', 'XL', 'SOM NY', 5899, 8200, false, true, 'active'),

  (p6, uid_rasmus,
   'New Balance 550 White Green',
   'Frisk fra boksen. Aldrig båret. Original NB boks medfølger.',
   'New Balance', 'Sneakers', 'EU 42', 'NY', 1099, 1100, false, false, 'active'),

  (p7, uid_sean,
   'Carhartt WIP Detroit Jacket',
   'Klassisk Carhartt workwear. God patina.',
   'Carhartt WIP', 'Outerwear', 'L', 'BRUGT', 1299, 2200, false, true, 'active'),

  (p8, uid_sean,
   'Stüssy 8 Ball Fleece',
   'Limited edition 8 ball fleece fra SS23. Brugt to gange — fejlfri stand.',
   'Stüssy', 'Hoodies', 'M', 'GOD', 1799, 2200, false, true, 'active');

-- Reviews
insert into public.reviews (author_id, subject_id, rating, text, product_title)
values
  (uid_mikkel,   uid_sean,     5, 'Perfekt handel. Hurtig sending og varen var præcis som beskrevet.', 'Nike Air Max 90'),
  (uid_oscar,    uid_sean,     5, 'Super professionel — boks og alt medfølgte.', 'Palace Tri-Ferg Hoodie'),
  (uid_frederik, uid_sean,     4, 'God handel. Sælger var imødekommende.', 'Stüssy World Tour Tee'),
  (uid_mikkel,   uid_frederik, 5, 'Fantastisk sælger. Alt autentisk og hurtig levering.', 'Stone Island Badge Hoodie');

end $$;
