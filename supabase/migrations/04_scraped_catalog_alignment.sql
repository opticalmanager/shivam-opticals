-- Migration 04: Scraped Catalog & Extended Shape Alignment
-- Supports luxury frames and contact lenses

-- Add source_url, color_variants, and package_dimensions columns to products if not present
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS package_dimensions JSONB DEFAULT '{"lengthCm": 18, "breadthCm": 9, "heightCm": 7, "weightKg": 0.25}'::jsonb;

-- Relax / extend shape CHECK constraint to include all optical shapes
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_shape_check;

-- Relax rim_type constraint if present
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_rim_type_check;

-- Relax original_price check constraint to allow NULL or matching prices
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_original_price_check;

ALTER TABLE IF EXISTS public.products
  ADD CONSTRAINT products_original_price_check CHECK (original_price IS NULL OR original_price >= base_price);

-- Index for source_url deduplication queries
CREATE INDEX IF NOT EXISTS idx_products_source_url ON public.products(source_url);
