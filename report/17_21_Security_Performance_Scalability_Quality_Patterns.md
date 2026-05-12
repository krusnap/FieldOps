# Sections 17–21: Security, Performance, Scalability, Code Quality, Design Patterns

---

# Section 17: Security Analysis

## 17.1 Authentication Security

| Aspect | Implementation | Risk Level | Notes |
|---|---|---|---|
| JWT verification | Supabase admin `getUser()` on every request | ✅ Low | No local secret — Supabase validates against JWKS |
| Token storage (mobile) | `AsyncStorage` | ⚠️ Medium | Not encrypted; use Expo SecureStore for production |
| Token storage (web) | Supabase SDK internal | ✅ Low | Uses httpOnly cookies or memory |
| Service role key | Backend `.env` only | ✅ Low | Never exposed to clients |
| Rate limiting on auth | 5 req/15 min | ✅ Low | Prevents brute force |
| Refresh token rotation | Automatic via Supabase | ✅ Low | Old refresh tokens invalidated |

## 17.2 Critical Security Vulnerability — Role Self-Assignment

**File**: `web/src/hooks/useRoleAccess.tsx` — Line 107

```typescript
// VULNERABILITY: User can set their own role
await supabase.auth.updateUser({
  data: { role, name: authUser.name },
});
```

**Impact**: Any authenticated user can call this from the browser console and escalate their role in `user_metadata`. While the backend enforces roles from `public.users` (mitigating API-level impact), the web dashboard derives routing and UI from `user_metadata` — allowing unauthorized users to see admin UI pages.

**Fix**:
```typescript
// Remove updateUser call entirely.
// After login, call /auth/me to get authoritative role from public.users
const { data: profile } = await apiClient.getMe();
setUser({ ...authUser, role: profile.data.role });
```

## 17.3 Security Checklist

| Check | Status | Notes |
|---|---|---|
| ✅ HTTPS enforced | Helmet HSTS header | Must enable in production with valid SSL |
| ✅ Security headers | Helmet.js | XSS, X-Frame-Options, CORP, COOP |
| ✅ CORS configured | Origin whitelist | Dev LAN IPs allowed in non-production |
| ✅ SQL injection prevention | Supabase parameterized queries | No raw SQL in app code |
| ✅ Input validation | Zod schemas on all inputs | |
| ✅ Rate limiting | Auth (5/15min) + API (200/min) | |
| ✅ Ownership checks | user_id === req.user.id | Prevents IDOR on trip/claim mutations |
| ✅ RLS enabled | All tables | Service role bypasses per design |
| ⚠️ Token storage (mobile) | AsyncStorage | Upgrade to Expo SecureStore |
| ❌ Role self-assignment bug | useRoleAccess.tsx | Fix immediately |
| ❌ No CSRF protection | Express lacks csurf | Add for web session endpoints |
| ❌ No request logging | No access log | Add Morgan or Pino HTTP logger |
| ❌ No secrets scanning | No git-secrets/gitleaks | .env committed without example |
| ❌ No API key rotation policy | | Document and schedule |
| ❌ No security audit | | Schedule OWASP ZAP scan |

## 17.4 Data Protection

| Data Type | Protection |
|---|---|
| Passwords | Managed by Supabase Auth (bcrypt) |
| GPS coordinates | Stored in PostgreSQL (not encrypted at rest by default) |
| JWT tokens | Short-lived (1hr), refresh rotation |
| PII (name, email) | In PostgreSQL; enable Supabase encryption at rest for production |
| Rate/km settings | Non-sensitive, stored in plain text |

## 17.5 API Security Hardening Recommendations

1. Add `express-mongo-sanitize` equivalent for object key injection
2. Implement request size validation beyond the 1MB body limit
3. Add `correlation-id` middleware for request tracing
4. Implement API versioning (`/api/v1/...`) before public release
5. Add IP allowlisting for admin endpoints in production

---

# Section 18: Performance Analysis

## 18.1 Database Query Performance

### Expensive Queries Identified

**`GET /api/employees`** — N+1 Problem:
```typescript
// For each employee (N), makes 2 additional queries:
const enriched = await Promise.all(employees.map(async (emp) => {
  const trips = await supabase.from("trips").select()...   // Query 2
  const approved = await supabase.from("claims")...        // Query 3
  const rejected = await supabase.from("claims")...        // Query 4
}));
// Total: 1 + 3N queries for N employees!
```
With 20 employees: **61 database queries** per request. Use `GROUP BY` aggregation or Supabase RPC functions.

**`GET /api/dashboard/admin`**:
Multiple sequential count queries. Could be consolidated into a single SQL aggregation query.

### Index Analysis
- All foreign keys are indexed ✅
- Common filter combinations have composite indexes ✅  
- Missing: `locations(user_id)` — used in some admin queries
- Missing: `trips(ended_at)` — used in some time-range queries

## 18.2 API Performance

| Endpoint | Est. Query Count | Optimization Priority |
|---|---|---|
| `GET /api/employees` | 1 + 3N | 🔴 High — N+1 problem |
| `GET /api/dashboard/admin` | 6+ sequential | 🟡 Medium |
| `POST /api/trips/:id/end` | 3-5 sequential | 🟡 Medium |
| `GET /api/claims` | 2-3 | 🟢 Low |
| `GET /api/bundles/manager` | 2 | 🟢 Low |

## 18.3 Mobile Performance

| Aspect | Implementation | Assessment |
|---|---|---|
| GPS polling | 15-sec setInterval | ✅ Reasonable frequency |
| Location batch | Every 4 points | ✅ Reduces network calls |
| Network check | 10-sec interval | ⚠️ Consider event-based approach |
| Battery check | 60-sec interval | ✅ Low impact |
| React context re-renders | Single context, 551 lines | ⚠️ All consumers re-render on any state change |
| Image assets | Not analyzed | — |

## 18.4 Real-Time Scalability

| Component | Current Limit | Production Concern |
|---|---|---|
| Socket.IO server | Single instance | Cannot scale horizontally without Redis adapter |
| Location buffer | In-memory array | Data loss on crash |
| DB write rate | 1 batch/5 sec | At 1000 employees: 200 inserts/sec — manageable |
| Manager broadcast | `io.to("managers")` | At scale, managers room grows — consider per-team rooms |

## 18.5 Performance Optimization Checklist

- [ ] Fix N+1 query in `/api/employees` with SQL aggregation
- [ ] Add response caching for dashboard endpoints (Redis, 30-60s TTL)
- [ ] Add database connection pooling (Supabase handles this but verify pool size)
- [ ] Implement pagination on all list endpoints (✅ already done)
- [ ] Add `ETag`/`Last-Modified` headers for cache validation
- [ ] Split `FieldOpsContext` to prevent unnecessary mobile re-renders
- [ ] Add CDN for web dashboard static assets
- [ ] Enable gzip compression (add `compression` middleware)
- [ ] Add Socket.IO Redis adapter for horizontal scaling

---

# Section 19: Scalability Assessment

## 19.1 Current Architecture Limits

| Dimension | Current Design | Estimated Limit | Bottleneck |
|---|---|---|---|
| Concurrent employees | Single Express process | ~500-1000 | Node.js event loop |
| Location events/sec | In-memory buffer | ~2000/sec | Memory + DB write speed |
| DB connections | Supabase connection pool | ~100 concurrent | Supabase free tier: 60 |
| WebSocket connections | Single Socket.IO instance | ~5000 | Memory per socket |
| API requests/min | 200/min per IP | Depends on IPs | Rate limiter |

## 19.2 Horizontal Scaling Path

```
Phase 1 (MVP - current):
  Single VPS → Express + Socket.IO + Supabase Cloud

Phase 2 (100-500 employees):
  Load Balancer → 2-3 Express instances
  + Redis for Socket.IO adapter (sticky sessions or Redis pub/sub)
  + Redis for API response caching
  + Supabase Pro plan (larger connection pool)

Phase 3 (500-5000 employees):
  Kubernetes cluster → auto-scaling Express pods
  + Dedicated PostgreSQL with read replicas
  + Separate WebSocket service (Socket.IO cluster)
  + Message queue (RabbitMQ/Kafka) for location events
  + CDN for static assets

Phase 4 (5000+ employees):
  Microservices split:
    - Auth Service
    - Trip Service  
    - Location Ingestion Service (high-write optimized)
    - Claims Service
    - Notification Service
  + Time-series DB (TimescaleDB) for location data
  + Event-driven architecture with Kafka
```

## 19.3 Database Scalability

The `locations` table will grow rapidly:
- 1 employee × 8 hours/day × 15-sec interval = **1,920 rows/employee/day**
- 100 employees × 250 working days = **48,000,000 rows/year**

**Recommendations**:
1. **Table partitioning**: Partition `locations` by month (`PARTITION BY RANGE (recorded_at)`)
2. **Data archival**: Archive location points older than 3 months to cold storage
3. **Aggregation**: Pre-compute daily route polylines as compressed JSON instead of storing raw points

---

# Section 20: Code Quality Review

## 20.1 Naming Conventions

| Convention | Backend | Mobile | Web | Assessment |
|---|---|---|---|---|
| File naming | `module.router.ts` | `ServiceName.ts` | `FeaturePage.tsx` | ✅ Consistent |
| Variable naming | camelCase | camelCase | camelCase | ✅ |
| Constant naming | UPPER_SNAKE | UPPER_SNAKE | — | ✅ |
| TypeScript interfaces | PascalCase | PascalCase | PascalCase | ✅ |
| SQL columns | snake_case | — | — | ✅ |

## 20.2 Code Quality Metrics (Estimated)

| Metric | Assessment |
|---|---|
| TypeScript strict mode | ✅ tsconfig has `"strict": true` |
| `any` type usage | ⚠️ Moderate — `(emp as any)`, `(t as any)` in router files |
| Error handling coverage | ✅ try/catch in all async handlers |
| Input validation coverage | ✅ Zod schemas on all endpoints |
| Code duplication | ⚠️ Manager scoping logic repeated in 3+ files |
| Comment quality | ✅ Section comments with ASCII dividers |
| Dead code | ⚠️ `TrackingScreen.tsx` may be unused |
| Average file length | Backend: 350 lines, Mobile Context: 551 lines | ⚠️ Context too long |

## 20.3 Technical Debt Items

| Debt Item | Severity | Estimated Fix |
|---|---|---|
| `FieldOpsContext.tsx` 551 lines (God Object) | 🔴 High | Split into 3-4 domain contexts (2-3 days) |
| N+1 queries in `/api/employees` | 🔴 High | Rewrite with SQL aggregation (1 day) |
| Role self-assignment vulnerability | 🔴 Critical | Remove `updateUser` call (2 hours) |
| No automated tests anywhere | 🔴 High | Write unit + integration tests (1-2 weeks) |
| `syncBundleTotals` in wrong file | 🟡 Medium | Move to shared service util (2 hours) |
| In-memory location buffer (crash risk) | 🟡 Medium | Add Redis or WAL-based buffer (1 day) |
| `any` type usage in routers | 🟡 Medium | Type properly (1 day) |
| Missing migration 003 | 🟡 Medium | Investigate and document (1 hour) |
| No `.env.example` files | 🟢 Low | Create for all 3 packages (1 hour) |
| `TrackingScreen.tsx` unused | 🟢 Low | Remove or integrate (1 hour) |
| `navigation/` directory empty | 🟢 Low | Remove or implement React Navigation (1+ week) |
| No API versioning | 🟢 Low | Add `/api/v1/` prefix (2 hours) |

---

# Section 21: Design Patterns Used

## 21.1 Patterns Identified

### Factory Pattern — `requireRole()`
```typescript
export function requireRole(...allowedRoles: string[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }
    next();
  };
}
```
The `requireRole` function is a factory that returns middleware functions — a classic Factory pattern for dynamic middleware creation.

### Observer Pattern — Socket.IO Events
The Socket.IO event system implements Publisher-Subscriber (Observer) pattern. The mobile app publishes `location:update` events; the server broadcasts to all subscribed managers in the "managers" room. Managers observe without tight coupling to the emitter.

### Repository Pattern (Implicit)
While not formally a Repository class, each router module acts as a repository for its domain entity — encapsulating all database interactions for that entity (trips, claims, bundles, employees).

### Context/Provider Pattern — React State
Both `FieldOpsContext` (mobile) and `RoleAccessContext` (web) implement the Context/Provider pattern for dependency injection of shared state throughout the component tree.

### Compensating Transaction Pattern
The trip-end handler implements a compensating transaction:
```
Trip complete → [Bundle upsert] → [Claim insert] → [Bundle sync]
Each step: attempt → log failure → continue without blocking trip completion
```

### Singleton Pattern — Supabase Clients
```typescript
// config/supabase.ts — module-level singletons
export const supabaseAdmin = createClient(url, serviceKey);
export const supabaseAnon = createClient(url, anonKey);
```
One client instance per role is shared across all route handlers.

### Strategy Pattern — Dashboard Data
The dashboard router implements different data aggregation strategies based on role:
```typescript
router.get("/employee", ...) // Employee strategy
router.get("/manager", ...)  // Manager strategy  
router.get("/admin", ...)    // Admin strategy
router.get("/accountant", ...) // Accountant strategy
```

## 21.2 Missing Patterns (Recommended)

| Pattern | Where to Apply | Benefit |
|---|---|---|
| Repository Pattern | Separate DB queries from routers | Testability, reuse |
| Service Layer | Between router and repository | Business logic isolation |
| DTO Pattern | Request/response shaping | Consistent API contracts |
| Circuit Breaker | Supabase client calls | Resilience under DB load |
| Event Bus | Trip end → claim creation | Decoupling, async processing |
