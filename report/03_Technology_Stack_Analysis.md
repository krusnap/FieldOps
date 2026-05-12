# Section 3: Technology Stack Analysis

## 3.1 Full Stack Inventory

| Layer | Technology | Version (pkg.json) | Rationale |
|---|---|---|---|
| Mobile App Framework | React Native (Expo) | SDK 53 / RN 0.79.6 | Cross-platform iOS+Android from one codebase; Expo simplifies native module management |
| Web Dashboard Framework | React + Vite | React 18.3, Vite 5.4 | Fast SPA development; Vite HMR is orders of magnitude faster than CRA |
| Backend Runtime | Node.js + TypeScript | TypeScript 5.8 | Non-blocking I/O ideal for real-time location streams; TypeScript adds type safety |
| Web Framework | Express.js | 4.18 | Minimal, battle-tested, huge ecosystem; appropriate for REST + Socket.IO hybrid server |
| Database | PostgreSQL via Supabase | Supabase JS v2 | PostgreSQL is the gold standard for relational data; Supabase adds Auth, RLS, realtime, admin API |
| Auth | Supabase Auth (JWT) | — | Managed auth with built-in JWT, OAuth, email verification; eliminates custom auth plumbing |
| Real-time | Socket.IO | 4.8 (server + client) | Reliable WS with fallback to polling; rooms/namespaces map well to manager monitoring use-case |
| HTTP Client (mobile) | Axios | 1.4 | Interceptors for token injection + auto-refresh; cleaner than fetch for REST calls |
| HTTP Client (web) | Axios | 1.15 | Same as above; Supabase session JWT attached via interceptor |
| Routing (web) | React Router DOM | 6.30 | File-based nested routing; `createBrowserRouter` with `RoleGuard` wrappers |
| Input Validation | Zod | 3.22 | Runtime schema validation on all POST/PATCH bodies; excellent TypeScript integration |
| Logging | Winston | 3.11 | Structured logging with timestamp/level formatting; production-ready |
| Rate Limiting | express-rate-limit | 7.1 | Auth endpoint (5 req/15 min) + global API (200 req/min) |
| Security Headers | Helmet.js | 7.1 | XSS, CSP, HSTS, X-Frame-Options etc. in one middleware |
| Maps | Mapbox GL JS | 2.15 (web) + react-native-maps | Route polyline rendering |
| GPS | expo-location | 18.1 | Foreground location with accuracy, speed, altitude |
| Battery Monitor | expo-battery | 9.1 | Low battery alert when ≤20% |
| Network Monitor | expo-network | 7.1 | Online/offline detection for UI indicators |
| Distance Algorithm | Custom Haversine | — | Server-side + client-side; 5m jitter filter, 200 km/h speed cap |

---

## 3.2 Technology Choice Analysis

### Why Supabase Auth instead of custom JWT?
Supabase Auth provides email/password authentication, JWT issuance, token refresh, and admin user management APIs out of the box. Building equivalent functionality from scratch would require: bcrypt password hashing, JWT signing/verification, refresh token rotation, and email verification flows — weeks of work with significant security risk. The trade-off is vendor lock-in; however, the backend only uses the `@supabase/supabase-js` SDK and could be replaced with a custom auth provider by swapping the `authenticate.ts` middleware.

### Why not Next.js for the web dashboard?
The web dashboard is a React SPA (not SSR). Next.js is optimized for pages that benefit from server-side rendering and SEO. A private internal dashboard doesn't need SSR. Vite + React Router gives faster development iteration with zero server overhead.

### Why Socket.IO instead of raw WebSockets?
Socket.IO adds automatic reconnection, event multiplexing, rooms/namespaces, and a polling fallback. For a location tracking system where mobile clients may briefly lose connectivity, automatic reconnection is critical. The "managers" room pattern enables targeted broadcasting without server-side fan-out logic.

### Why Zod for validation?
Zod provides runtime type checking that TypeScript's static types cannot enforce at API boundaries. Every incoming request body is validated against a Zod schema before any database interaction, preventing injection and data corruption at the handler level.

### Why Haversine over PostGIS?
The schema includes `CREATE EXTENSION IF NOT EXISTS pgcrypto` but notably NOT PostGIS. The distance calculation is performed in TypeScript (server-side) using a custom Haversine implementation with noise filtering. This is a deliberate simplification: PostGIS adds operational complexity (extension management, spatial indexing) that isn't needed for simple point-to-point polyline distance. The existing implementation is accurate to within ~0.5% for distances under 1000 km.

### Alternatives Considered (Implicit from Architecture)

| Component | Chosen | Alternatives | Trade-off |
|---|---|---|---|
| Auth | Supabase Auth | Auth0, Clerk, Firebase Auth | Supabase is free tier + same vendor as DB |
| DB | PostgreSQL/Supabase | Firebase Firestore, MongoDB | Relational model fits travel+claims domain better |
| Real-time | Socket.IO | Supabase Realtime, Pusher | Socket.IO supports auth middleware + custom events |
| Mobile | Expo/RN | Flutter, native iOS/Android | Single codebase; Expo managed workflow removes native build headaches |
| Bundler | Vite | CRA, Webpack | Vite is significantly faster for development |

---

## 3.3 Dependency Health Assessment

| Package | Status | Note |
|---|---|---|
| `expo` SDK 53 | ✅ Current stable | Released 2025 |
| `react-native` 0.79.6 | ✅ Recent | New architecture support |
| `socket.io` 4.8 | ✅ Current | |
| `@supabase/supabase-js` v2 | ✅ Stable | |
| `helmet` 7.x | ✅ Current | |
| `zod` 3.x | ✅ Stable | |
| `mapbox-gl` 2.15 | ⚠️ v3 available | Breaking changes in v3; migration needed before production |
| `react-native-maps` 1.20 | ✅ Stable | |
| `express` 4.18 | ✅ Stable | Express 5 beta exists; not urgent |
| Missing: `bcrypt` | N/A | Auth delegated to Supabase |
| Missing: `jest`/`vitest` | ❌ | No testing framework installed anywhere |
| Missing: `husky`/`lint-staged` | ❌ | No pre-commit hooks |
