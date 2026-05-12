# FieldOps Recovery Report

## Purpose
This document is a working map of the FieldOps codebase for when you return after a long break. It focuses on what exists, what is partial, what is still mock or disconnected, and what should be stabilized first.

## What FieldOps Is
FieldOps is a field travel tracking and reimbursement system.

The intended flow is:
1. An employee logs into the mobile app.
2. They start a trip and the app records GPS locations.
3. The backend stores trip and location data, calculates distance, and creates daily claim bundles.
4. Managers review bundles and claims in the web dashboard.
5. Accountants review approved claims for reimbursement.
6. Admin users manage users, permissions, and system oversight in the web app.

## High-Level Architecture
### Mobile App
Path: `app/`

Main responsibilities:
- Employee login
- Trip lifecycle actions
- Location polling and tracking
- Dashboard status display
- Claims bundle viewing and submission
- Profile view

Important files:
- `app/App.tsx`
- `app/src/context/FieldOpsContext.tsx`
- `app/src/services/api.ts`
- `app/src/services/distance.ts`
- `app/src/services/location.ts`
- `app/src/services/socketService.ts`
- `app/src/screens/DashboardScreen.tsx`
- `app/src/screens/TrackingScreen.tsx`
- `app/src/screens/TripDetailsScreen.tsx`
- `app/src/screens/ClaimsScreen.tsx`
- `app/src/screens/DailyClaimDetailScreen.tsx`
- `app/src/screens/ProfileScreen.tsx`

### Backend API
Path: `backend/`

Main responsibilities:
- Auth
- Trip lifecycle
- Location ingestion
- Distance calculation
- Claims and daily bundles
- Employee and dashboard APIs
- Socket.IO realtime events

Important files:
- `backend/src/index.ts`
- `backend/src/config/socket.ts`
- `backend/src/config/supabase.ts`
- `backend/src/middleware/authenticate.ts`
- `backend/src/middleware/requireRole.ts`
- `backend/src/modules/auth/auth.router.ts`
- `backend/src/modules/trips/trips.router.ts`
- `backend/src/modules/locations/locations.router.ts`
- `backend/src/modules/locations/locationSocket.ts`
- `backend/src/modules/claims/claims.router.ts`
- `backend/src/modules/claims/bundles.router.ts`
- `backend/src/modules/employees/employees.router.ts`
- `backend/src/modules/dashboard/dashboard.router.ts`
- `backend/src/utils/haversine.ts`

### Web Dashboard
Path: `web/`

Main responsibilities:
- Manager dashboard
- Employee monitoring
- Claim review
- Accountant review
- Admin views
- Auth and role-based routing

Important files:
- `web/src/main.tsx`
- `web/src/app/App.tsx`
- `web/src/app/router/index.tsx`
- `web/src/hooks/useRoleAccess.tsx`
- `web/src/lib/apiClient.ts`
- `web/src/lib/supabase.ts`
- `web/src/features/manager/dashboard/ManagerDashboardPage.tsx`
- `web/src/features/manager/employees/EmployeesListPage.tsx`
- `web/src/features/manager/employees/EmployeeDetailPage.tsx`
- `web/src/features/manager/claims/ClaimsReviewPage.tsx`
- `web/src/features/manager/claims/ClaimDetailPage.tsx`
- `web/src/features/accountant/dashboard/AccountantDashboardPage.tsx`
- `web/src/features/accountant/claims/AccountantClaimsPage.tsx`
- `web/src/features/accountant/claims/AccountantClaimDetailPage.tsx`
- `web/src/features/admin/*`
- `web/src/mocks/data.ts`

## What Is Implemented
### Backend: Mostly Real and Functional
The backend is the most complete part of the repo.

Implemented and wired:
- Supabase auth validation
- JWT-based request authentication
- Role-based authorization middleware
- Trip start, pause, resume, end
- Trip history and active trip lookup
- Distance calculation from location points
- Location batch upload endpoint
- Socket.IO authentication and broadcasting
- Claims list, create, approve, reject, override
- Daily claim bundles, submission, approval, rejection, notes
- Employee listing and employee stats
- Employee and manager dashboard summary endpoints

### Mobile: Feature-Rich but Not Fully Clean
The mobile app has a real structure and a working flow.

Implemented:
- Login flow
- Session restore
- Trip state management
- GPS polling
- Location batching and socket emission
- Dashboard screens
- Claims bundle screens
- Trip history screen
- Profile screen

### Web: Mixed Quality
The web app is split between live pages and mock/demo pages.

Live or mostly live:
- Manager dashboard
- Employee list
- Claims review flow
- Accountant dashboard
- Accountant claims table and detail view

Mock or local-only:
- Admin pages
- Employee detail route replay
- Manager claim detail route replay
- Several analytics and system monitoring views

## What Is Partial, Mock, or Disconnected
### Mobile
- Dashboard metrics still rely on context state that is only partly filled from backend data.
- Geofence and alert behavior looks functional, but some values are defaulted from metadata.
- Tracking screen uses a different status vocabulary from the rest of the app.
- The app still exposes some synthetic fallback values such as region and checkpoint data.

### Backend
- Realtime location buffering is in-memory only; there is no durable queue or Redis adapter in the current implementation.
- Distance calculation exists in multiple places, which increases drift risk.
- Some logic is multi-step and not transactional, especially trip end plus claim creation plus bundle sync.

### Web
- Admin experience is mostly mock data and local state.
- Employee route replay and claim detail pages still use seeded data and placeholders.
- Map components are visual placeholders, not real route maps.
- The web app does not appear to consume the backend realtime socket stream.

## Current Technical Debt
### Inconsistencies
- Role names differ across layers.
- Trip status names differ across layers.
- Claim status names differ across layers.
- Data shapes are translated repeatedly instead of shared.
- Some frontend types use `any` or fallback field names.

### Architecture Debt
- Distance logic is duplicated in backend SQL, backend TypeScript, and mobile TypeScript.
- The mobile context is too large and carries too many responsibilities.
- The web app mixes live APIs and mock data without a clear boundary.
- Realtime backend storage is not durable.
- There is no shared contract package for types and API response shapes.

### Build and Setup Debt
- The mobile package currently has a broken TypeScript/Expo config.
- Some planning docs are stale and no longer match the current code.

## What Looks Stable
- Backend auth and role gating
- Backend trip lifecycle endpoints
- Backend bundle submission and manager approval flow
- Backend claims CRUD and review flow
- Mobile login and session restoration shape
- Mobile trip lifecycle control flow
- Manager and accountant web dashboards using real API data

## What Needs Redesign or Cleanup
- Shared domain types
- Status naming conventions
- Mobile state architecture
- Realtime location storage strategy
- Mock/admin web pages
- Map and trip replay visualization
- Centralized configuration for distance and geofence thresholds

## Suggested Recovery Order
1. Fix the mobile build configuration.
2. Standardize roles, statuses, and API DTOs.
3. Make distance rules and geofence thresholds single-source.
4. Replace or isolate mock web admin pages.
5. Add durable realtime buffering for locations.
6. Add tests around auth, trip end, claim creation, and bundle sync.

## Practical Mental Model
If you return later and want the shortest path to understanding the system, read in this order:
1. `backend/src/index.ts`
2. `backend/src/modules/trips/trips.router.ts`
3. `backend/src/modules/claims/bundles.router.ts`
4. `backend/src/modules/locations/locationSocket.ts`
5. `app/src/context/FieldOpsContext.tsx`
6. `web/src/app/router/index.tsx`
7. `web/src/features/manager/dashboard/ManagerDashboardPage.tsx`
8. `web/src/features/manager/claims/ClaimsReviewPage.tsx`
9. `web/src/mocks/data.ts`

## Bottom Line
FieldOps is not production-complete yet. The core backend workflow is real, the mobile app is substantially built but currently blocked by setup issues and some incomplete state wiring, and the web dashboard is a hybrid of live business pages plus a large mock/admin scaffold that still needs to be finished or intentionally separated.
