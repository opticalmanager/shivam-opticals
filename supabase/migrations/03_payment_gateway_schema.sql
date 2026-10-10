-- ==============================================================================
-- Shivam Optics - 03_payment_gateway_schema.sql
-- Razorpay Payment Gateway & Reconciliation Schema
-- ==============================================================================

-- 1. Ensure payment tracking columns exist on public.orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- 2. Indexes for rapid reconciliation and transaction search
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
