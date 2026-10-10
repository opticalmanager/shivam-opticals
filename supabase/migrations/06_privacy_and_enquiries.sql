-- ==============================================================================
-- Shivam Optics - Privacy Requests & Data Protection Schema
-- Compliant with Digital Personal Data Protection (DPDP) Act India & GDPR
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('access_data', 'delete_data', 'opt_out_marketing', 'rectify_data', 'other')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_email ON public.privacy_requests(email);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON public.privacy_requests(status);

-- Automatic updated_at trigger
DROP TRIGGER IF EXISTS update_privacy_requests_updated_at ON public.privacy_requests;
CREATE TRIGGER update_privacy_requests_updated_at
  BEFORE UPDATE ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

-- Allow public to submit privacy requests
DROP POLICY IF EXISTS "Public can submit privacy requests" ON public.privacy_requests;
CREATE POLICY "Public can submit privacy requests"
  ON public.privacy_requests FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own requests if authenticated, or admins to view all
DROP POLICY IF EXISTS "Users can view own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users can view own privacy requests"
  ON public.privacy_requests FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- Admins can update status of privacy requests
DROP POLICY IF EXISTS "Admins can update privacy requests" ON public.privacy_requests;
CREATE POLICY "Admins can update privacy requests"
  ON public.privacy_requests FOR UPDATE
  USING (public.is_admin());
