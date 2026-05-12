# Sections 13–16: Notifications, API Inventory, Frontend, Backend Analysis

---

# Section 13: Notification System

## 13.1 Current State

| Notification Type | Status | Implementation |
|---|---|---|
| Real-time location broadcast to managers | ✅ | Socket.IO `location:broadcast` event |
| Trip start/end notifications to managers | ✅ | Socket.IO `trip:started`/`trip:ended` events |
| In-app alerts (low battery, offline, geofence) | ✅ | Client-side state in `FieldOpsContext.alerts` |
| Push notifications (mobile — FCM/APNs) | ❌ | Not implemented |
| Email notifications | ❌ | Not implemented |
| Claim approved/rejected notification to employee | ❌ | Not implemented |
| In-app notification center | ❌ | Not implemented |

## 13.2 Socket.IO Event Map

| Event | Direction | Payload | Consumers |
|---|---|---|---|
| `location:update` | App → Server | `{trip_id, lat, lng, accuracy, speed, recorded_at}` | Server buffers to DB |
| `location:broadcast` | Server → Managers | `{user_id, user_name, trip_id, lat, lng, speed}` | Manager web dashboard |
| `trip:started` | App → Server | `{trip_id}` | Server broadcasts to managers |
| `trip:ended` | App → Server | `{trip_id, distance_km}` | Server broadcasts to managers |
| `location:error` | Server → App | `{message}` | Mobile app error display |

## 13.3 Missing: Push Notifications

For production deployment, the following should be implemented:

```
Suggested: Expo Push Notifications (FCM + APNs via Expo)
Trigger points:
  - Claim approved → notify employee
  - Claim rejected → notify employee with reason  
  - New pending claim → notify manager
  - Bundle submitted → notify assigned manager
```

**Implementation path**: `expo-notifications` + store `pushToken` in `public.users`, trigger from backend after approval/rejection.

---

# Section 14: API Analysis

## 14.1 Complete API Endpoint Inventory

### Authentication (`/auth`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/login` | No | Any | Email/password login, returns JWT |
| POST | `/auth/refresh` | No | Any | Refresh JWT using refresh_token |
| POST | `/auth/logout` | Bearer | Any | Invalidate session |
| GET | `/auth/me` | Bearer | Any | Get current user profile |

### Trips (`/api/trips`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/trips/start` | Bearer | Any | Start new trip; returns trip object |
| PATCH | `/api/trips/:id/pause` | Bearer | Owner | Pause active trip |
| PATCH | `/api/trips/:id/resume` | Bearer | Owner | Resume paused trip |
| POST | `/api/trips/:id/end` | Bearer | Owner | End trip; auto-creates claim+bundle |
| GET | `/api/trips/active` | Bearer | Any | Get current active/paused trip |
| GET | `/api/trips/history` | Bearer | Any | Paginated completed trips |
| GET | `/api/trips/employee/:userId` | Bearer | MANAGER/ADMIN | Employee trips (manager view) |
| GET | `/api/trips/:id` | Bearer | Owner/MGR/ADM | Trip details + locations |

### Locations (`/api/locations`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/locations/batch` | Bearer | Any | Upload batch of GPS points |
| GET | `/api/locations/:tripId` | Bearer | Owner/MGR/ADM | All points for a trip |

### Claims (`/api/claims`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/claims` | Bearer | Any | List claims (role-filtered) |
| GET | `/api/claims/:id` | Bearer | Owner/MGR/ADM | Single claim detail |
| POST | `/api/claims` | Bearer | Any | Create manual claim |
| POST | `/api/claims/manager/create` | Bearer | MGR/ADMIN | Create claim on behalf of employee |
| PATCH | `/api/claims/:id/approve` | Bearer | MGR/ADMIN | Approve pending claim |
| PATCH | `/api/claims/:id/reject` | Bearer | MGR/ADMIN | Reject pending claim |
| PATCH | `/api/claims/:id/override` | Bearer | MGR/ADMIN | Override rejected with corrected distance |

### Bundles (`/api/bundles`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/bundles` | Bearer | Any | Employee's own bundles |
| GET | `/api/bundles/manager` | Bearer | MGR/ADMIN | All assigned employee bundles |
| GET | `/api/bundles/:id` | Bearer | Owner/MGR/ADM | Bundle detail + child claims |
| PATCH | `/api/bundles/:id/submit` | Bearer | Owner | Submit draft bundle |
| PATCH | `/api/bundles/:id/approve` | Bearer | MGR/ADMIN | Approve bundle + all claims |
| PATCH | `/api/bundles/:id/reject` | Bearer | MGR/ADMIN | Reject bundle + all claims |
| POST | `/api/bundles/:id/note` | Bearer | Owner | Add note to draft bundle |

### Employees (`/api/employees`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/employees` | Bearer | MGR/ADMIN | List assigned employees with stats |
| GET | `/api/employees/all` | Bearer | ADMIN | All users in system |
| POST | `/api/employees/create` | Bearer | ADMIN | Create new user in Auth + DB |
| GET | `/api/employees/assignments` | Bearer | ADMIN | All active assignments |
| POST | `/api/employees/assignments` | Bearer | ADMIN | Assign employee to manager |
| DELETE | `/api/employees/assignments/:id` | Bearer | ADMIN | Remove assignment |
| GET | `/api/employees/:id/stats` | Bearer | Any | Weekly stats for employee |
| GET | `/api/employees/:id` | Bearer | MGR/ADMIN | Employee detail + trips + claims |
| PATCH | `/api/employees/:id` | Bearer | ADMIN | Update user (name/role/rate/status) |
| DELETE | `/api/employees/:id/deactivate` | Bearer | ADMIN | Soft-delete user |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/dashboard/employee` | Bearer | Any | Employee KPIs: today distance, pending claims, compliance |
| GET | `/api/dashboard/manager` | Bearer | MGR/ADMIN | Team stats: employees, pending/approved counts |
| GET | `/api/dashboard/admin` | Bearer | ADMIN | System-wide stats + travel trend |
| GET | `/api/dashboard/accountant` | Bearer | ACC/ADMIN | Financial summary of all bundles |

### System
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |

**Total endpoints: 36**

## 14.2 Standard Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... }
}
```
Or on error:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Paginated endpoints add:
```json
{
  "pagination": {
    "page": 1, "limit": 20, "total": 150, "totalPages": 8
  }
}
```

## 14.3 API Security Measures

| Measure | Implementation |
|---|---|
| JWT verification | Every authenticated endpoint via `authenticate` middleware |
| Role enforcement | `requireRole()` factory on restricted endpoints |
| Input validation | Zod schemas on all POST/PATCH bodies |
| Rate limiting | Global: 200 req/min; Auth: 5 req/15 min |
| Security headers | Helmet.js (XSS, CSP, HSTS, etc.) |
| CORS | Whitelist-based with dev LAN allowance |
| Ownership checks | `user_id = req.user.id` before data mutation |
| SQL injection | Parameterized queries via Supabase SDK |

---

# Section 15: Frontend Analysis

## 15.1 Mobile App Architecture

### State Management: Context API (Single Context Pattern)
```
FieldOpsProvider (FieldOpsContext.tsx)
  ├── Auth State: user, isAuthenticated, isInitializing
  ├── Trip State: tripStatus, tripId, elapsedSeconds, distanceKm
  ├── Location State: path, currentLocation, gpsPointsCount
  ├── Claims State: claims, pendingClaimAmountInr
  ├── Network State: network (isOnline, isSyncing)
  ├── Alert State: alerts (outsideGeofence, offline, gpsDisabled, lowBattery)
  └── Dashboard State: todayDistanceKm, weeklyCompliance, assignedManager
```

**Strength**: All state is centralized, making it easy to share data across screens.  
**Weakness**: `FieldOpsContext.tsx` is 551 lines — violates Single Responsibility Principle. As features are added, this file will become unmaintainable.

### Navigation Pattern
Tab-based navigation using a `switch(activeTab)` in `App.tsx`. Tabs: dashboard, trips, claims, profile.

**Issue**: No React Navigation — limits features like modal sheets, nested navigation, deep linking, and hardware back-button handling on Android.

### Screen Inventory
| Screen | Purpose | Key Features |
|---|---|---|
| `LoginScreen` | Authentication | Email/password form, error display |
| `DashboardScreen` | Home screen | Today km, elapsed timer, GPS map, trip controls |
| `TripDetailsScreen` | Trip history | Paginated list, trip stats, route on map |
| `ClaimsScreen` | Bundle list | Daily bundle cards with status badges |
| `DailyClaimDetailScreen` | Bundle detail | Claims list, note editor, submit button |
| `ProfileScreen` | User info | Employee ID, manager assignment, logout |
| `TrackingScreen` | Detailed tracking | May be unused/redundant with DashboardScreen |

### API Integration Pattern
```typescript
// Axios instance with:
// - Base URL from EXPO_PUBLIC_API_URL env var
// - Request interceptor: reads token from AsyncStorage
// - Response interceptor: auto-refresh on 401
// - 15 second timeout
```

## 15.2 Web Dashboard Architecture

### Framework: React + Vite + React Router v6

```
main.tsx
  └── RoleAccessProvider (Supabase auth context)
        └── RouterProvider
              ├── /login → LoginPage
              ├── /manager → RoleGuard(manager) → AppShell
              │     ├── /manager/dashboard → ManagerDashboardPage
              │     ├── /manager/employees → EmployeesListPage
              │     ├── /manager/employees/:id → EmployeeDetailPage
              │     ├── /manager/claims → ClaimsReviewPage
              │     ├── /manager/claims/:id → ClaimDetailPage
              │     └── /manager/reports → ManagerReportsPage
              ├── /admin → RoleGuard(admin) → AppShell
              │     ├── /admin/dashboard → AdminDashboardPage
              │     ├── /admin/users → UserManagementPage
              │     ├── /admin/manager-control → ManagerControlPage
              │     ├── /admin/permissions → PermissionsPage
              │     ├── /admin/analytics → AdminAnalyticsPage
              │     └── /admin/data-viewer → DataViewerPage
              └── /accountant → RoleGuard(accountant) → AppShell
                    ├── /accountant/dashboard → AccountantDashboardPage
                    └── /accountant/claims → AccountantClaimsPage
```

### Role Guard Implementation
```typescript
// RoleGuard.tsx — protects routes by role
function RoleGuard({ allowedRole, children }) {
  const { user, isLoading } = useRoleAccess();
  if (isLoading) return <Spinner />;
  if (!user || user.role !== allowedRole) return <Navigate to="/login" />;
  return children;
}
```

### API Client Pattern (Web)
```typescript
// apiClient.ts — Axios with Supabase JWT
client.interceptors.request.use(async config => {
  const { data } = await supabase.auth.getSession();
  config.headers.Authorization = `Bearer ${data?.session?.access_token}`;
  return config;
});
```

This is called on every request — it adds ~1-2ms latency but ensures the token is always fresh.

---

# Section 16: Backend Analysis

## 16.1 Architecture Pattern

The backend uses a **Router-per-Module** pattern without a formal layered architecture:

```
Request → Middleware Stack → Router Handler → Supabase SDK → Database
```

There is no dedicated Service Layer or Repository Layer. Business logic (distance calculation, claim creation) lives directly in route handlers.

## 16.2 Middleware Stack (per request)

```
1. Helmet.js          — Security headers
2. CORS               — Origin whitelist check
3. express.json()     — Body parsing (1MB limit)
4. apiLimiter         — 200 req/min rate limit
5. authenticate       — JWT → req.user (per-route, not global)
6. requireRole()      — Role check (per-route where needed)
7. Route Handler      — Business logic + Supabase queries
8. AppError handler   — Operational errors (4xx)
9. Generic handler    — Unexpected errors (500)
```

## 16.3 Error Handling

```typescript
// AppError.ts — operational vs programmer errors
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;  // true = expected error (404, 401, etc.)
}

// Global error handler in index.ts
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({success:false, error: err.message});
  }
  // Unexpected error — log full stack, return generic 500
  logger.error("Unhandled error", {message: err.message, stack: err.stack});
  res.status(500).json({success:false, error: "Internal server error"});
});
```

All route handlers use `try/catch → next(err)` pattern consistently.

## 16.4 Logging

```typescript
// logger.ts — Winston
const level = process.env.NODE_ENV === "production" ? "info" : "debug";
// Format: "2026-05-11 18:24:36 [INFO] Trip started {"tripId":"...", "userId":"..."}"
```

- **Development**: debug level (all SQL-level context)
- **Production**: info level (business events only)
- **Missing**: Log file transport, log rotation, centralized log aggregation (e.g., Papertrail, Datadog)

## 16.5 Key Business Logic Locations

| Logic | File | Lines |
|---|---|---|
| Distance calculation + noise filtering | `utils/haversine.ts` | 76 |
| Compensating claim creation on trip end | `modules/trips/trips.router.ts` | ~255-320 |
| Location buffer + 5s batch flush | `modules/locations/locationSocket.ts` | ~34-56 |
| Manager scoping in claims | `modules/claims/claims.router.ts` | ~44-56 |
| Bundle total recalculation | `modules/claims/bundles.router.ts` | ~15-33 |
| Admin travel trend calculation | `modules/dashboard/dashboard.router.ts` | ~262-288 |

## 16.6 Socket.IO Architecture

```
initSocketServer() — attaches to HTTP server
  ├── JWT middleware (verifies on connection)
  ├── io.on("connection"):
  │     ├── socket.join("user:{userId}")
  │     └── if MANAGER/ADMIN: socket.join("managers")
  └── registerLocationSocket(io):
        ├── location:update → validate → buffer → broadcast to managers
        ├── trip:started → broadcast to managers room
        └── trip:ended → broadcast to managers room

Location buffer: in-memory array, flushed to DB every 5 seconds
```

**Concern**: The location buffer is in-memory. A server crash loses buffered (unflushed) location points. Recommend Redis-backed buffer for production resilience.
