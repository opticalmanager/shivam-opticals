-- ==============================================================================
-- Shivam Optics - 02_try_on_schema.sql
-- 3D Virtual Try-On Configuration & Calibration Extension
-- ==============================================================================

-- 1. Add Try-On columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS try_on_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS try_on_model_url TEXT,
  ADD COLUMN IF NOT EXISTS try_on_configuration JSONB DEFAULT '{
    "modelVersion": 1,
    "calibrationVersion": 1,
    "scaleMultiplier": 1.0,
    "verticalOffset": -0.008,
    "depthOffset": 0.015,
    "pitchOffset": 0.02,
    "yawOffset": 0.0,
    "rollOffset": 0.0,
    "frameWidth": 140,
    "lensWidth": 53,
    "bridgeWidth": 18,
    "templeLength": 145
  }'::jsonb;

-- 2. Index for filtering products that have 3D Try-On available
CREATE INDEX IF NOT EXISTS idx_products_try_on_enabled ON public.products(try_on_enabled);
