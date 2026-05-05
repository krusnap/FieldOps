-- FT-TRMS Database Schema Migration 002
-- Creates trips, locations, and claims tables for GPS tracking & reimbursement

-- ─── Trips Table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trips (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'paused', 'completed')),
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                TIMESTAMPTZ,
  total_distance_km       NUMERIC(10,3) DEFAULT 0,
  total_duration_seconds  INTEGER DEFAULT 0,
  pause_duration_seconds  INTEGER DEFAULT 0,
  paused_at               TIMESTAMPTZ,
  start_latitude          NUMERIC(10,7),
  start_longitude         NUMERIC(10,7),
  end_latitude            NUMERIC(10,7),
  end_longitude           NUMERIC(10,7),
  avg_speed_kmh           NUMERIC(6,2) DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON public.trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON public.trips(started_at DESC);

-- ─── Locations Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude        NUMERIC(10,7) NOT NULL,
  longitude       NUMERIC(10,7) NOT NULL,
  accuracy        NUMERIC(8,2),
  speed           NUMERIC(8,2),
  altitude        NUMERIC(10,2),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_trip_id ON public.locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_trip_recorded ON public.locations(trip_id, recorded_at);

-- ─── Claims Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_inr      NUMERIC(10,2) NOT NULL DEFAULT 0,
  rate_per_km     NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  distance_km     NUMERIC(10,3) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  category        TEXT NOT NULL DEFAULT 'Trip Reimbursement',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by     UUID REFERENCES public.users(id),
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_trip_id ON public.claims(trip_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_user_status ON public.claims(user_id, status);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY trips_service_all ON public.trips
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY locations_service_all ON public.locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY claims_service_all ON public.claims
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own trips
CREATE POLICY trips_self_read ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own locations
CREATE POLICY locations_self_read ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own claims
CREATE POLICY claims_self_read ON public.claims
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Haversine Distance Function (PL/pgSQL) ──────────────────────────────────
-- Used for server-side distance recalculation

CREATE OR REPLACE FUNCTION public.calculate_trip_distance(p_trip_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_distance NUMERIC := 0;
  prev_lat NUMERIC;
  prev_lon NUMERIC;
  prev_time TIMESTAMPTZ;
  cur RECORD;
  seg_distance NUMERIC;
  seg_time_sec NUMERIC;
  seg_speed_mps NUMERIC;
BEGIN
  FOR cur IN
    SELECT latitude, longitude, recorded_at
    FROM public.locations
    WHERE trip_id = p_trip_id
    ORDER BY recorded_at ASC
  LOOP
    IF prev_lat IS NOT NULL THEN
      -- Haversine formula
      seg_distance := 6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(cur.latitude - prev_lat) / 2), 2) +
        COS(RADIANS(prev_lat)) * COS(RADIANS(cur.latitude)) *
        POWER(SIN(RADIANS(cur.longitude - prev_lon) / 2), 2)
      ));

      seg_time_sec := GREATEST(EXTRACT(EPOCH FROM (cur.recorded_at - prev_time)), 1);
      seg_speed_mps := seg_distance / seg_time_sec;

      -- Filter noise: ignore < 5m (jitter) and > 55 m/s (~200 km/h)
      IF seg_distance >= 5 AND seg_speed_mps <= 55 THEN
        total_distance := total_distance + seg_distance;
      END IF;
    END IF;

    prev_lat := cur.latitude;
    prev_lon := cur.longitude;
    prev_time := cur.recorded_at;
  END LOOP;

  RETURN ROUND(total_distance / 1000, 3); -- Return km
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
