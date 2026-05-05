-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Test Daily Claim Bundles + Claims
-- Run this in Supabase SQL Editor AFTER running migration 004.
--
-- This script auto-detects your EMPLOYEE user and seeds 5 daily bundles
-- across the past week with different statuses to test the full UI flow.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_employee_id   UUID;
  v_rate_per_km   NUMERIC := 10.00;

  -- Bundle IDs
  b_today         UUID;
  b_yesterday     UUID;
  b_2days         UUID;
  b_3days         UUID;
  b_4days         UUID;

  -- Date vars
  d_today         DATE := CURRENT_DATE;
  d_yesterday     DATE := CURRENT_DATE - 1;
  d_2days         DATE := CURRENT_DATE - 2;
  d_3days         DATE := CURRENT_DATE - 3;
  d_4days         DATE := CURRENT_DATE - 4;

BEGIN
  -- ── Step 1: Find the first active EMPLOYEE user ─────────────────────────────
  SELECT id, COALESCE(rate_per_km, 10.00)
  INTO   v_employee_id, v_rate_per_km
  FROM   public.users
  WHERE  role = 'EMPLOYEE'
    AND  is_active = TRUE
  ORDER BY created_at ASC
  LIMIT  1;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'No active EMPLOYEE found. Create one first, then re-run this seed.';
  END IF;

  RAISE NOTICE 'Seeding for employee: %', v_employee_id;

  -- ── Step 2: Clean up any existing test bundles for this employee ────────────
  -- (Safe to re-run — deletes and recreates)
  DELETE FROM public.daily_claim_bundles
  WHERE  user_id = v_employee_id
    AND  claim_date >= d_4days;

  -- ── Step 3: TODAY — DRAFT (1 trip, employee has not submitted yet) ──────────
  INSERT INTO public.daily_claim_bundles
    (id, user_id, claim_date, status, total_amount_inr, total_distance_km, trip_count, notes)
  VALUES
    (gen_random_uuid(), v_employee_id, d_today, 'draft', 92.50, 9.25, 1, NULL)
  RETURNING id INTO b_today;

  INSERT INTO public.claims
    (user_id, bundle_id, amount_inr, rate_per_km, distance_km, status, category, notes)
  VALUES
    (v_employee_id, b_today, 92.50, v_rate_per_km, 9.25, 'draft', 'Trip Reimbursement',
     'Morning field visit to Sector 7 client.');

  -- ── Step 4: YESTERDAY — DRAFT (2 trips, ready to submit) ───────────────────
  INSERT INTO public.daily_claim_bundles
    (id, user_id, claim_date, status, total_amount_inr, total_distance_km, trip_count, notes)
  VALUES
    (gen_random_uuid(), v_employee_id, d_yesterday, 'draft', 276.00, 27.60, 2, NULL)
  RETURNING id INTO b_yesterday;

  INSERT INTO public.claims
    (user_id, bundle_id, amount_inr, rate_per_km, distance_km, status, category, notes)
  VALUES
    (v_employee_id, b_yesterday, 140.00, v_rate_per_km, 14.00, 'draft', 'Trip Reimbursement', 'AM Route'),
    (v_employee_id, b_yesterday, 136.00, v_rate_per_km, 13.60, 'draft', 'Trip Reimbursement', 'PM Route');

  -- ── Step 5: 2 DAYS AGO — PENDING (submitted, awaiting manager) ─────────────
  INSERT INTO public.daily_claim_bundles
    (id, user_id, claim_date, status, total_amount_inr, total_distance_km, trip_count, notes)
  VALUES
    (gen_random_uuid(), v_employee_id, d_2days, 'pending', 420.00, 42.00, 3,
     'Had extra visit to warehouse. Please approve at the earliest.')
  RETURNING id INTO b_2days;

  INSERT INTO public.claims
    (user_id, bundle_id, amount_inr, rate_per_km, distance_km, status, category, notes)
  VALUES
    (v_employee_id, b_2days,  92.00, v_rate_per_km,  9.20, 'pending', 'Trip Reimbursement', NULL),
    (v_employee_id, b_2days, 184.00, v_rate_per_km, 18.40, 'pending', 'Trip Reimbursement', NULL),
    (v_employee_id, b_2days, 144.00, v_rate_per_km, 14.40, 'pending', 'Trip Reimbursement', 'Warehouse visit');

  -- ── Step 6: 3 DAYS AGO — APPROVED ──────────────────────────────────────────
  INSERT INTO public.daily_claim_bundles
    (id, user_id, claim_date, status, total_amount_inr, total_distance_km, trip_count,
     notes, reviewed_at)
  VALUES
    (gen_random_uuid(), v_employee_id, d_3days, 'approved', 210.00, 21.00, 2,
     'Regular field rounds.', NOW() - INTERVAL '2 days')
  RETURNING id INTO b_3days;

  INSERT INTO public.claims
    (user_id, bundle_id, amount_inr, rate_per_km, distance_km, status, category,
     reviewed_at)
  VALUES
    (v_employee_id, b_3days, 100.00, v_rate_per_km, 10.00, 'approved', 'Trip Reimbursement',
     NOW() - INTERVAL '2 days'),
    (v_employee_id, b_3days, 110.00, v_rate_per_km, 11.00, 'approved', 'Trip Reimbursement',
     NOW() - INTERVAL '2 days');

  -- ── Step 7: 4 DAYS AGO — REJECTED (with reason) ────────────────────────────
  INSERT INTO public.daily_claim_bundles
    (id, user_id, claim_date, status, total_amount_inr, total_distance_km, trip_count,
     notes, rejection_reason, reviewed_at)
  VALUES
    (gen_random_uuid(), v_employee_id, d_4days, 'rejected', 350.00, 35.00, 2,
     'Covered North Zone client visits.',
     'GPS data incomplete — distance could not be verified. Please contact manager.',
     NOW() - INTERVAL '3 days')
  RETURNING id INTO b_4days;

  INSERT INTO public.claims
    (user_id, bundle_id, amount_inr, rate_per_km, distance_km, status, category,
     notes, reviewed_at)
  VALUES
    (v_employee_id, b_4days, 180.00, v_rate_per_km, 18.00, 'rejected', 'Trip Reimbursement',
     'North Zone AM', NOW() - INTERVAL '3 days'),
    (v_employee_id, b_4days, 170.00, v_rate_per_km, 17.00, 'rejected', 'Trip Reimbursement',
     'North Zone PM', NOW() - INTERVAL '3 days');

  RAISE NOTICE 'Seeding complete!';
  RAISE NOTICE '  TODAY        (draft)    — 1 trip  — ₹92.50';
  RAISE NOTICE '  YESTERDAY    (draft)    — 2 trips — ₹276.00';
  RAISE NOTICE '  2 DAYS AGO   (pending)  — 3 trips — ₹420.00';
  RAISE NOTICE '  3 DAYS AGO   (approved) — 2 trips — ₹210.00';
  RAISE NOTICE '  4 DAYS AGO   (rejected) — 2 trips — ₹350.00';

END $$;
