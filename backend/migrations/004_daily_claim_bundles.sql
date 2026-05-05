-- FT-TRMS Migration 004
-- Adds daily_claim_bundles table and links claims to bundles

-- ─── Daily Claim Bundles Table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_claim_bundles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_date          DATE NOT NULL,                  -- '2026-05-05' (started_at date of the day)
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  total_amount_inr    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_distance_km   NUMERIC(10,3) NOT NULL DEFAULT 0,
  trip_count          INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,                           -- employee note to manager
  reviewed_by         UUID REFERENCES public.users(id),
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, claim_date)                       -- one bundle per employee per day
);

CREATE INDEX IF NOT EXISTS idx_bundles_user_id      ON public.daily_claim_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_status       ON public.daily_claim_bundles(status);
CREATE INDEX IF NOT EXISTS idx_bundles_claim_date   ON public.daily_claim_bundles(claim_date DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_user_date    ON public.daily_claim_bundles(user_id, claim_date DESC);

-- ─── Alter Claims Table ───────────────────────────────────────────────────────
-- Add bundle_id FK and 'draft' as valid status

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES public.daily_claim_bundles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_claims_bundle_id ON public.claims(bundle_id);

-- Widen claims.status check to include 'draft'
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE public.claims
  ADD CONSTRAINT claims_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- ─── RLS Policies for daily_claim_bundles ─────────────────────────────────────

ALTER TABLE public.daily_claim_bundles ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY bundles_service_all ON public.daily_claim_bundles
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own bundles
CREATE POLICY bundles_self_read ON public.daily_claim_bundles
  FOR SELECT USING (auth.uid() = user_id);
