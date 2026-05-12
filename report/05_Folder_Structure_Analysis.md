# Section 5: Folder and File Structure Analysis

## 5.1 Root Directory

```
e:\Projects\FieldOps\
├── .env                          ← Root-level env (likely shared config)
├── .gitignore                    ← Comprehensive: node_modules, .env, dist, .expo
├── FT_TRMS_DevPipeline_PromptBible.txt  ← Development prompt guide (56KB)
├── FieldOps_Recovery_Report.md   ← Historical recovery documentation
├── Gamma_PPT_Prompt_Full.md      ← Presentation generation prompt
├── app/                          ← Mobile application
├── backend/                      ← API server
├── docs/                         ← Project documentation
├── shared/                       ← Shared TypeScript types
├── task.md                       ← Development task tracker
└── web/                          ← Web dashboard
```

**Note**: The presence of `FT_TRMS_DevPipeline_PromptBible.pdf/txt` and `Gamma_PPT_Prompt_Full.md` indicates this project was developed with AI assistance and has accompanying process documentation. These should be moved to `docs/` for cleanliness.

---

## 5.2 Backend Directory (`backend/`)

```
backend/
├── .env                          ← SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PORT, CORS_ORIGINS, NODE_ENV
├── package.json                  ← Dependencies: express, zod, helmet, cors, socket.io, winston, supabase-js
├── tsconfig.json                 ← Strict TypeScript config
├── migrations/
│   ├── 001_users_table.sql       ← users, employee_manager_assignments, system_settings, RLS, trigger
│   ├── 002_trips_locations_claims.sql  ← trips, locations, claims, Haversine PL/pgSQL function
│   ├── 004_daily_claim_bundles.sql     ← daily_claim_bundles, bundle_id FK on claims
│   ├── 005_seed_test_claims.sql        ← Test data seeding
│   └── 006_fix_manager_assignments.sql ← Cross-join assignment fix script
└── src/
    ├── index.ts                  ← Server entry: Express setup, CORS, middleware, routes, Socket.IO
    ├── config/
    │   ├── supabase.ts           ← supabaseAdmin (service role) + supabaseAnon clients
    │   └── socket.ts             ← Socket.IO server init, JWT auth middleware, room management
    ├── middleware/
    │   ├── authenticate.ts       ← JWT verification + user profile attach to req.user
    │   ├── requireRole.ts        ← Role-based access factory middleware
    │   └── rateLimiter.ts        ← Auth limiter (5/15min) + API limiter (200/min)
    ├── modules/
    │   ├── auth/
    │   │   └── auth.router.ts    ← POST /login, POST /refresh, POST /logout, GET /me
    │   ├── trips/
    │   │   └── trips.router.ts   ← POST /start, PATCH /:id/pause|resume, POST /:id/end, GET /active|history|:id
    │   ├── locations/
    │   │   ├── locations.router.ts   ← POST /batch, GET /:tripId
    │   │   └── locationSocket.ts    ← Socket.IO location:update handler + 5s batch flush
    │   ├── claims/
    │   │   ├── claims.router.ts     ← Full CRUD + approve/reject/override + manager create
    │   │   └── bundles.router.ts    ← Daily bundle CRUD + submit/approve/reject/note
    │   ├── employees/
    │   │   └── employees.router.ts  ← List, all, create, assignments, stats, get/:id, patch, deactivate
    │   └── dashboard/
    │       └── dashboard.router.ts  ← /employee, /manager, /admin, /accountant aggregates
    └── utils/
        ├── AppError.ts           ← Custom error class with statusCode + isOperational
        ├── haversine.ts          ← GPS distance calculation: jitter filter, speed cap, km output
        └── logger.ts             ← Winston logger: debug (dev) / info (prod)
```

### Notable Backend Design Decisions
- **All route files are single-file routers** — no separate controller/service layer split. This is appropriate for an MVP but will require refactoring as the codebase grows.
- **Migration 003 is missing** — migrations jump from 002 to 004, suggesting a migration was deleted or never committed.
- **`syncBundleTotals` is exported from `bundles.router.ts`** and imported by `trips.router.ts` — a cross-module coupling that should be moved to a shared service utility.

---

## 5.3 Mobile App Directory (`app/`)

```
app/
├── App.tsx                       ← Root component: FieldOpsProvider wrapper + tab routing
├── app.json                      ← Expo config: name, slug, Android permissions
├── babel.config.js               ← Expo preset
├── package.json                  ← expo, react-native, axios, socket.io-client, expo-location etc.
├── tsconfig.json
└── src/
    ├── components/               ← Shared UI components (BottomNav, etc.)
    ├── context/
    │   └── FieldOpsContext.tsx   ← MAIN STATE MANAGER: 551 lines, all app state + business logic
    ├── hooks/
    │   └── useFieldOps.ts        ← Re-export of useContext(FieldOpsContext) for convenience
    ├── lib/
    │   └── supabase.ts           ← Supabase client for mobile (anon key)
    ├── navigation/               ← Empty — navigation is tab-switch in App.tsx
    ├── screens/
    │   ├── LoginScreen.tsx       ← Email/password form
    │   ├── DashboardScreen.tsx   ← Today stats, GPS map, trip control buttons
    │   ├── TrackingScreen.tsx    ← Detailed tracking view (may be unused)
    │   ├── TripDetailsScreen.tsx ← Trip history list with locations
    │   ├── ClaimsScreen.tsx      ← Daily bundle list
    │   ├── DailyClaimDetailScreen.tsx  ← Bundle details + submit
    │   └── ProfileScreen.tsx     ← User info + logout
    ├── services/
    │   ├── api.ts                ← Axios instance + all REST API calls (443 lines)
    │   ├── socketService.ts      ← Socket.IO connection + emit helpers
    │   ├── location.ts           ← expo-location permission + fetchCurrentLocation
    │   └── distance.ts           ← Client-side Haversine + shouldIgnorePoint + geofence
    ├── theme/                    ← Color tokens, typography
    └── types/
        └── fieldOps.ts           ← TypeScript interfaces: EmployeeUser, TripRecord, etc.
```

### Notable App Design Decisions
- **`FieldOpsContext.tsx` is the God Object** — 551 lines managing all state, side effects, intervals, session restoration, and business logic. This is a known pattern for small apps but should be split into domain-specific contexts (AuthContext, TripContext, ClaimsContext) as the app grows.
- **Navigation is tab-switch in App.tsx** — a simple `switch(activeTab)` pattern rather than React Navigation. This limits deep linking, back-button handling, and modal stacking.
- **`navigation/` directory is empty** — React Navigation was likely considered but not implemented; navigation is purely tab-based.
- **Dual-auth pattern**: Mobile app does Supabase direct auth AND stores tokens in AsyncStorage for the backend Axios instance. Both channels are maintained in sync.

---

## 5.4 Web Dashboard Directory (`web/`)

```
web/
├── index.html                    ← Vite entry HTML
├── vite.config.ts                ← @vitejs/plugin-react
├── package.json                  ← React, React Router, Axios, Supabase, Mapbox
└── src/
    ├── main.tsx                  ← ReactDOM.createRoot + RoleAccessProvider + RouterProvider
    ├── app/
    │   ├── App.tsx               ← Root (thin wrapper)
    │   ├── layout/
    │   │   ├── AppShell.tsx      ← Sidebar + outlet layout wrapper
    │   │   ├── Sidebar.tsx       ← Role-based navigation links
    │   │   └── TopNavbar.tsx     ← Header with user info + logout
    │   ├── providers/            ← Provider wrappers
    │   └── router/
    │       └── index.tsx         ← createBrowserRouter with RoleGuard-protected routes
    ├── features/
    │   ├── auth/
    │   │   ├── LoginPage.tsx     ← Role selector + email/password form
    │   │   └── RoleGuard.tsx     ← Route protection by role
    │   ├── manager/
    │   │   ├── dashboard/        ← ManagerDashboardPage
    │   │   ├── employees/        ← EmployeesListPage, EmployeeDetailPage
    │   │   ├── claims/           ← ClaimsReviewPage, ClaimDetailPage
    │   │   └── reports/          ← ManagerReportsPage
    │   ├── admin/
    │   │   ├── dashboard/        ← AdminDashboardPage
    │   │   ├── users/            ← UserManagementPage
    │   │   ├── manager-control/  ← ManagerControlPage (assignments)
    │   │   ├── permissions/      ← PermissionsPage
    │   │   ├── analytics/        ← AdminAnalyticsPage
    │   │   └── data-viewer/      ← DataViewerPage
    │   └── accountant/
    │       ├── dashboard/        ← AccountantDashboardPage
    │       └── claims/           ← AccountantClaimsPage, AccountantClaimDetailPage
    ├── hooks/
    │   ├── useRoleAccess.tsx     ← Auth context provider + login/logout + session init
    │   ├── useTheme.tsx          ← Theme toggle (dark/light)
    │   └── useToast.tsx          ← Toast notification hook
    ├── lib/
    │   ├── apiClient.ts          ← Axios instance with Supabase JWT interceptor (194 lines)
    │   ├── supabase.ts           ← Supabase client (anon key)
    │   ├── constants.ts          ← Shared constants
    │   └── utils.ts              ← Helper utilities
    ├── mocks/                    ← Mock data (possibly still used in some pages)
    ├── styles/
    │   └── globals.css           ← Global CSS (likely Tailwind or custom CSS)
    └── types/
        └── domain.ts             ← AppRole type, shared domain interfaces
```
