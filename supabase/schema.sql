-- ═══════════════════════════════════════════════════════
--  Gusto Bar à Couscous — Supabase Schema + Seed Data
--  Project : fpzguymeoqvawqnsbhjr
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. CATEGORIES
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL       PRIMARY KEY,
  name          TEXT         NOT NULL,
  slug          TEXT         NOT NULL UNIQUE,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ──────────────────────────────────────────
-- 2. MENU ITEMS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL        PRIMARY KEY,
  category_id   INT           REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT          NOT NULL,
  description   TEXT,
  price         NUMERIC(8,2)  NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  tag           TEXT,
  is_available  BOOLEAN       NOT NULL DEFAULT true,
  display_order INT           NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read available menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

-- ──────────────────────────────────────────
-- 3. ORDERS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  customer_name   TEXT          NOT NULL,
  customer_phone  TEXT          NOT NULL,
  order_type      TEXT          NOT NULL DEFAULT 'dine-in'
                                CHECK (order_type IN ('dine-in','takeout')),
  notes           TEXT,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','preparing','ready','completed','cancelled')),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_charge  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Read orders (open — tighten with auth later)"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- ──────────────────────────────────────────
-- 4. ORDER ITEMS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL        PRIMARY KEY,
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name   TEXT          NOT NULL,
  item_price  NUMERIC(8,2)  NOT NULL,
  quantity    INT           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total  NUMERIC(10,2) GENERATED ALWAYS AS (item_price * quantity) STORED
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Read order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- ──────────────────────────────────────────
-- 5. RESERVATIONS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  first_name       TEXT         NOT NULL,
  last_name        TEXT         NOT NULL,
  email            TEXT         NOT NULL,
  phone            TEXT         NOT NULL,
  date             DATE         NOT NULL,
  time             TEXT         NOT NULL,
  guests           TEXT         NOT NULL,
  occasion         TEXT,
  special_requests TEXT,
  status           TEXT         NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','cancelled'))
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can make a reservation"
  ON reservations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Read reservations"
  ON reservations FOR SELECT
  TO anon, authenticated
  USING (true);

-- ══════════════════════════════════════════
-- GRANT API ACCESS (required when Data API
-- does NOT auto-expose new tables)
-- ══════════════════════════════════════════
GRANT SELECT             ON categories  TO anon, authenticated;
GRANT SELECT             ON menu_items  TO anon, authenticated;
GRANT SELECT, INSERT     ON orders      TO anon, authenticated;
GRANT SELECT, INSERT     ON order_items TO anon, authenticated;
GRANT SELECT, INSERT     ON reservations TO anon, authenticated;
GRANT USAGE, SELECT      ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ══════════════════════════════════════════
-- SEED — CATEGORIES
-- ══════════════════════════════════════════
INSERT INTO categories (name, slug, display_order) VALUES
  ('Starters',  'starters',  1),
  ('Couscous',  'couscous',  2),
  ('Tajine',    'tajine',    3),
  ('Desserts',  'desserts',  4),
  ('Drinks',    'drinks',    5)
ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════
-- SEED — MENU ITEMS
-- ══════════════════════════════════════════
INSERT INTO menu_items (category_id, name, description, price, image_url, tag, display_order) VALUES

  -- ── Starters ──
  (
    (SELECT id FROM categories WHERE slug = 'starters'),
    'Harira Soup',
    'Classic Moroccan tomato & lentil soup with chickpeas, herbs and warm spices.',
    9.00,
    'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&q=80',
    'Traditional', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'starters'),
    'Mezze Plate',
    'Hummus, zaalouk (eggplant salad), taktouka, olives & fresh bread.',
    16.00,
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    'Sharing', 2
  ),
  (
    (SELECT id FROM categories WHERE slug = 'starters'),
    'Briouats au Poulet',
    'Crispy filo pastry triangles filled with spiced chicken, almonds & herbs.',
    13.00,
    'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80',
    NULL, 3
  ),

  -- ── Couscous ──
  (
    (SELECT id FROM categories WHERE slug = 'couscous'),
    'Couscous Royal',
    'Steamed semolina with lamb, merguez, chicken, seasonal vegetables & harissa broth.',
    28.00,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    'Chef''s Pick', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'couscous'),
    'Couscous Végétarien',
    'Seven-vegetable couscous with turnips, chickpeas, zucchini & aromatic broth.',
    20.00,
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80',
    'Vegetarian', 2
  ),
  (
    (SELECT id FROM categories WHERE slug = 'couscous'),
    'Couscous Agneau',
    'Slow-braised lamb shoulder over fluffy couscous with raisins & caramelized onions.',
    26.00,
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
    NULL, 3
  ),

  -- ── Tajine ──
  (
    (SELECT id FROM categories WHERE slug = 'tajine'),
    'Tajine Poulet Citron',
    'Free-range chicken with preserved lemon, green olives, ginger & saffron.',
    24.00,
    'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80',
    'Signature', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'tajine'),
    'Tajine Kefta Mkaouara',
    'Spiced lamb meatballs in tomato sauce with poached eggs & fresh herbs.',
    22.00,
    'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
    NULL, 2
  ),

  -- ── Desserts ──
  (
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'Baklava Maison',
    'Honey & pistachio baklava, house-made with orange blossom water.',
    10.00,
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
    'Sweet', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'Mhanncha (Snake Cake)',
    'Coiled filo pastry filled with almond paste, cinnamon & orange blossom.',
    12.00,
    'https://images.unsplash.com/photo-1567327613485-fea8b1899267?w=600&q=80',
    NULL, 2
  ),

  -- ── Drinks ──
  (
    (SELECT id FROM categories WHERE slug = 'drinks'),
    'Atay — Moroccan Mint Tea',
    'Ceremonial green tea poured from height, packed with fresh spearmint & sugar.',
    6.00,
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
    'Traditional', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'drinks'),
    'Limonade à la Rose',
    'Fresh lemon juice with rose water, honey & crushed ice.',
    7.00,
    'https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=600&q=80',
    NULL, 2
  )

ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════
-- VERIFY (run after the above)
-- ══════════════════════════════════════════
-- SELECT c.name AS category, mi.name, mi.price
-- FROM menu_items mi
-- JOIN categories c ON c.id = mi.category_id
-- ORDER BY c.display_order, mi.display_order;
