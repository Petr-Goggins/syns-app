/*
# Sync — Add "Hot Product" Flag

1. Modified Tables
   - food_products: added is_hot boolean column for featured/popular products

2. Purpose
   - Mark certain products as "hot" or "popular" to display on dashboard
*/

-- ── food_products: add is_hot flag ────────────────
ALTER TABLE food_products ADD COLUMN IF NOT EXISTS is_hot boolean DEFAULT false;

COMMENT ON COLUMN food_products.is_hot IS 'Flag to mark popular/featured products';

-- Set some existing products as hot (example: protein-rich foods)
UPDATE food_products SET is_hot = true WHERE name ILIKE '%протеин%' OR name ILIKE '%творог%' OR name ILIKE '%курица%' LIMIT 5;
