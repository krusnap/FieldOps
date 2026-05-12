# Section 6: Database Design Analysis

## 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
        jsonb user_metadata
        timestamptz created_at
    }

    USERS {
        uuid id PK_FK
        text email
        text full_name
        text role
        text phone
        numeric rate_per_km
        boolean is_active
        timestamptz created_at
    }

    EMPLOYEE_MANAGER_ASSIGNMENTS {
        uuid id PK
        uuid employee_id FK
        uuid manager_id FK
        timestamptz assigned_at
        boolean active
    }

    SYSTEM_SETTINGS {
        text key PK
        text value
        timestamptz updated_at
        uuid updated_by FK
    }

    TRIPS {
        uuid id PK
        uuid user_id FK
        text status
        timestamptz started_at
        timestamptz ended_at
        numeric total_distance_km
        integer total_duration_seconds
        integer pause_duration_seconds
        timestamptz paused_at
        numeric start_latitude
        numeric start_longitude
        numeric end_latitude
        numeric end_longitude
        numeric avg_speed_kmh
        timestamptz created_at
    }

    LOCATIONS {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        numeric latitude
        numeric longitude
        numeric accuracy
        numeric speed
        numeric altitude
        timestamptz recorded_at
    }

    CLAIMS {
        uuid id PK
        uuid trip_id FK
        uuid bundle_id FK
        uuid user_id FK
        numeric amount_inr
        numeric rate_per_km
        numeric distance_km
        text status
        text category
        text notes
        timestamptz created_at
        uuid reviewed_by FK
        timestamptz reviewed_at
    }

    DAILY_CLAIM_BUNDLES {
        uuid id PK
        uuid user_id FK
        date claim_date
        text status
        numeric total_amount_inr
        numeric total_distance_km
        integer trip_count
        text notes
        uuid reviewed_by FK
        timestamptz reviewed_at
        text rejection_reason
        timestamptz created_at
        timestamptz updated_at
    }

    AUTH_USERS ||--|| USERS : "extends"
    USERS ||--o{ EMPLOYEE_MANAGER_ASSIGNMENTS : "has assignments as employee"
    USERS ||--o{ EMPLOYEE_MANAGER_ASSIGNMENTS : "manages as manager"
    USERS ||--o{ TRIPS : "records"
    USERS ||--o{ LOCATIONS : "generates"
    USERS ||--o{ CLAIMS : "submits"
    USERS ||--o{ DAILY_CLAIM_BUNDLES : "owns"
    TRIPS ||--o{ LOCATIONS : "contains"
    TRIPS ||--o| CLAIMS : "generates"
    DAILY_CLAIM_BUNDLES ||--o{ CLAIMS : "groups"
    USERS ||--o{ SYSTEM_SETTINGS : "updates"
```

---

## 6.2 Table Inventory

| Table | Rows (Est. Dev) | Purpose |
|---|---|---|
| `auth.users` | Managed by Supabase | Primary identity store |
| `public.users` | 10–100 | App profile extending auth.users |
| `employee_manager_assignments` | ~50 | Many-to-many employee-manager relationships |
| `system_settings` | 5 (seeded) | Global configuration: rate, GPS interval, speed cap |
| `trips` | 1000s | Trip records with lifecycle status |
| `locations` | 100,000s | Raw GPS points (15-sec interval × trips) |
| `claims` | 1000s | Individual reimbursement claim per trip |
| `daily_claim_bundles` | 100s | Daily grouping of claims for batch approval |

---

## 6.3 Table Design Details

### `public.users`
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email TEXT NOT NULL UNIQUE
full_name TEXT NOT NULL
role TEXT CHECK (role IN ('EMPLOYEE','MANAGER','ADMIN','ACCOUNTANT'))
phone TEXT  -- optional, rarely populated
rate_per_km NUMERIC(8,2) DEFAULT 10.00  -- per-employee reimbursement rate
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ
```
**Design note**: `role` is stored as TEXT with a CHECK constraint rather than a PostgreSQL ENUM. This is more flexible for migrations but loses some DB-level type safety.

### `public.trips`
```sql
status TEXT CHECK (status IN ('active','paused','completed'))
total_distance_km NUMERIC(10,3)  -- 3 decimal precision (meters resolution)
avg_speed_kmh NUMERIC(6,2)
pause_duration_seconds INTEGER   -- tracks cumulative pause time
paused_at TIMESTAMPTZ            -- timestamp when last paused (for resume calculation)
```
**Design note**: Pause duration is accumulated incrementally on each resume and finalized on trip end. This is correct but requires careful handling of the `paused_at` → `pause_duration_seconds` pattern on the `resume` endpoint.

### `public.locations`
```sql
latitude NUMERIC(10,7)   -- 7 decimal places ≈ 11mm precision
longitude NUMERIC(10,7)
accuracy NUMERIC(8,2)    -- meters (from device GPS)
speed NUMERIC(8,2)       -- m/s (from device)
altitude NUMERIC(10,2)   -- meters above sea level
recorded_at TIMESTAMPTZ
```
**Design note**: The schema uses `NUMERIC` rather than `GEOGRAPHY` (PostGIS). This is intentional given the Haversine approach. A PostGIS `GEOGRAPHY(Point, 4326)` column would enable spatial indexing and `ST_Distance` queries but adds operational complexity.

### `public.daily_claim_bundles`
- One-per-day per employee (`UNIQUE (user_id, claim_date)`)
- `trip_count`, `total_amount_inr`, `total_distance_km` are denormalized aggregates, kept in sync via `syncBundleTotals()` function
- Status hierarchy: `draft` → `pending` → `approved` / `rejected`
- `rejection_reason` only populated on rejection

---

## 6.4 Indexing Strategy

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_users_role` | users | role | Role-based queries in dashboard |
| `idx_users_is_active` | users | is_active | Active employee filtering |
| `idx_ema_employee` | employee_manager_assignments | employee_id | Employee assignment lookup |
| `idx_ema_manager` | employee_manager_assignments | manager_id | Manager's employee list |
| `idx_trips_user_id` | trips | user_id | All trips by user |
| `idx_trips_status` | trips | status | Active trip lookup |
| `idx_trips_user_status` | trips | (user_id, status) | Composite: active trip per user |
| `idx_trips_started_at` | trips | started_at DESC | Chronological trip listing |
| `idx_locations_trip_id` | locations | trip_id | All points for a trip |
| `idx_locations_trip_recorded` | locations | (trip_id, recorded_at) | Ordered route reconstruction |
| `idx_claims_user_status` | claims | (user_id, status) | Employee's pending claims |
| `idx_claims_bundle_id` | claims | bundle_id | Bundle → claims lookup |
| `idx_bundles_user_date` | daily_claim_bundles | (user_id, claim_date DESC) | Latest bundles per employee |

**Assessment**: The indexing strategy is well-considered. The composite `(user_id, status)` indexes are particularly important for the dashboard queries that filter by both dimensions simultaneously. **Missing index**: `locations(user_id)` — used in some queries but not indexed.

---

## 6.5 Row Level Security (RLS)

All tables have RLS enabled. The security model uses two policies per table:

| Policy Pattern | Effect |
|---|---|
| `service_role` full access | Backend API (using service role key) bypasses RLS |
| `auth.uid() = user_id` self-read | Users can only read their own data via Supabase client |

This is the correct pattern for a backend-mediated API. The service role key is used server-side only; all client-direct Supabase queries (web dashboard `useRoleAccess`) use the anon key which is subject to RLS.

**Security concern**: The web dashboard's `useRoleAccess.tsx` reads role from `user_metadata` and does `supabase.auth.updateUser({data: {role}})` on login — this allows a user to self-assign any role. This is a **critical security vulnerability** discussed further in Section 17.

---

## 6.6 Database Triggers

```sql
-- Auto-creates public.users row when Supabase Auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This trigger ensures that any user created via Supabase Auth (including the Admin API used in `employees.router.ts`) automatically gets a profile row in `public.users`. The `admin.createUser()` call in the employees router also does an explicit `upsert` as a safety net.

---

## 6.7 Database Functions

### `public.calculate_trip_distance(trip_id UUID)`
A PL/pgSQL implementation of Haversine distance calculation stored in the database. This mirrors the TypeScript implementation in `haversine.ts` and serves as an alternative/verification path. It applies the same noise filters: ≥5m minimum segment, ≤55 m/s maximum speed.

**Note**: This function is defined in the schema but not called by the current API. It represents a future opportunity for database-side recalculation (e.g., for a batch recalculation job or admin correction).

---

## 6.8 Migration Gap Analysis

| Migration | File | Status |
|---|---|---|
| 001 | `001_users_table.sql` | ✅ Present |
| 002 | `002_trips_locations_claims.sql` | ✅ Present |
| 003 | *Missing* | ❌ Gap — likely deleted |
| 004 | `004_daily_claim_bundles.sql` | ✅ Present |
| 005 | `005_seed_test_claims.sql` | ✅ Present (test data) |
| 006 | `006_fix_manager_assignments.sql` | ✅ Present (utility script) |

The gap at migration 003 is a minor concern — it suggests a migration was applied to the database but the file was not committed, or a migration was created and then abandoned. No functional schema gaps are evident from the current code.
