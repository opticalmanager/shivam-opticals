-- ==============================================================================
-- Shivam Optics - Migration 07: OTP Verifications & Patron Profile Extension
-- Enables secure, cryptographically verified Phone OTP authentication
-- ==============================================================================

-- 1. Create otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes for phone and cooldown/rate-limit verification
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_created ON public.otp_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_unverified ON public.otp_verifications(phone, verified_at, expires_at);

-- 2. Relax email NOT NULL constraint on public.profiles to allow phone-first registration
ALTER TABLE public.profiles 
  ALTER COLUMN email DROP NOT NULL;

-- 3. Ensure phone verification and loyalty columns exist on public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verification_channel TEXT,
  ADD COLUMN IF NOT EXISTS gem_loyalty_points INTEGER DEFAULT 0;

-- 4. Enable Row Level Security (RLS) on otp_verifications
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Service role / direct server queries can manage OTP records
DROP POLICY IF EXISTS "Admins can view otp verifications" ON public.otp_verifications;
CREATE POLICY "Admins can view otp verifications"
  ON public.otp_verifications FOR ALL
  USING (public.is_admin());
