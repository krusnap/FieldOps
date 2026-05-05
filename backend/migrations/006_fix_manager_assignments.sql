-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Assign all EMPLOYEE users to all MANAGER users
-- Run this in Supabase SQL Editor if claims are not visible on manager dashboard.
-- ─────────────────────────────────────────────────────────────────────────────

-- Option A: Assign every employee to every manager (recommended for testing)
INSERT INTO public.employee_manager_assignments (employee_id, manager_id, active)
SELECT
  e.id AS employee_id,
  m.id AS manager_id,
  TRUE  AS active
FROM public.users e
CROSS JOIN public.users m
WHERE e.role = 'EMPLOYEE'
  AND m.role IN ('MANAGER', 'ADMIN')
  AND e.is_active = TRUE
  AND m.is_active = TRUE
ON CONFLICT (employee_id, active) DO NOTHING;

-- Verify assignments were created
SELECT
  e.full_name   AS employee,
  m.full_name   AS manager,
  a.active
FROM public.employee_manager_assignments a
JOIN public.users e ON e.id = a.employee_id
JOIN public.users m ON m.id = a.manager_id
ORDER BY m.full_name, e.full_name;
