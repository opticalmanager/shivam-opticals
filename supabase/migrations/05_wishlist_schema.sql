-- ==============================================================================
-- Shivam Optics - Wishlist Schema Migration
-- ==============================================================================

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraints for user and guest sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product 
  ON public.wishlist_items (user_id, product_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_session_product 
  ON public.wishlist_items (session_id, product_id) 
  WHERE session_id IS NOT NULL;

-- Fast query lookup indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_session ON public.wishlist_items (session_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist_items (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON public.wishlist_items (created_at DESC);

-- Trigger to auto update updated_at
DROP TRIGGER IF EXISTS update_wishlist_items_updated_at ON public.wishlist_items;
CREATE TRIGGER update_wishlist_items_updated_at
  BEFORE UPDATE ON public.wishlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own wishlist items
DROP POLICY IF EXISTS "Users can read own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can read own wishlist"
  ON public.wishlist_items FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND session_id IS NOT NULL) OR
    public.is_admin()
  );

-- Allow users to insert their own wishlist items
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can insert own wishlist"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND session_id IS NOT NULL) OR
    public.is_admin()
  );

-- Allow users to delete their own wishlist items
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist_items FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND session_id IS NOT NULL) OR
    public.is_admin()
  );
