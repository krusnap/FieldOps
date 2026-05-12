# Section 4: System Architecture

## 4.1 Overall Architecture Description

FieldOps follows a **3-tier client-server architecture** with an additional real-time channel:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT TIER                         │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │  Mobile App (Expo)  │   │  Web Dashboard (Vite)   │  │
│  │  - Employee UX      │   │  - Manager Portal       │  │
│  │  - GPS Tracking     │   │  - Admin Portal         │  │
│  │  - Claims Submit    │   │  - Accountant Portal    │  │
│  └──────────┬──────────┘   └──────────────┬──────────┘  │
└─────────────┼────────────────────────────-┼─────────────┘
              │ HTTPS REST + WebSocket       │ HTTPS REST
┌─────────────▼──────────────────────────── ▼─────────────┐
│                    APPLICATION TIER                      │
│            Node.js + Express + Socket.IO                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Middleware: Helmet, CORS, Rate Limit, Authenticate │ │
│  ├──────────┬──────────┬──────────┬────────┬───────────┤ │
│  │  /auth   │  /trips  │/locations│/claims │/employees │ │
│  │  /dashboard         │/bundles  │        │           │ │
│  └──────────┴──────────┴──────────┴────────┴───────────┘ │
│            Socket.IO Server (location rooms)             │
└─────────────────────────┬───────────────────────────────┘
                          │ Supabase-JS SDK
┌─────────────────────────▼───────────────────────────────┐
│                      DATA TIER                          │
│              Supabase (PostgreSQL + Auth)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  users │ trips │ locations │ claims │ bundles     │   │
│  │  employee_manager_assignments │ system_settings   │   │
│  │  Row Level Security Policies                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 4.2 Mermaid Architecture Diagram

```mermaid
graph TB
    subgraph MobileApp["📱 Mobile App (Expo/React Native)"]
        FA[FieldOpsContext]
        AS[API Service - Axios]
        SS[Socket Service - Socket.IO Client]
        LS[Location Service - expo-location]
        DS[Distance Service - Haversine]
    end

    subgraph WebApp["🖥️ Web Dashboard (React + Vite)"]
        RA[RoleAccessProvider]
        AC[apiClient - Axios]
        WR[Router - React Router v6]
        subgraph Portals
            MP[Manager Portal]
            AP[Admin Portal]
            ACP[Accountant Portal]
        end
    end

    subgraph Backend["⚙️ Backend (Node.js + Express)"]
        IDX[index.ts - App Entry]
        MW[Middleware Layer]
        subgraph Routers
            AR[auth.router]
            TR[trips.router]
            LR[locations.router]
            CR[claims.router]
            BR[bundles.router]
            ER[employees.router]
            DR[dashboard.router]
        end
        SOC[Socket.IO Server]
        LSK[locationSocket Handler]
        HAV[Haversine Util]
    end

    subgraph SupabaseCloud["☁️ Supabase Cloud"]
        SBA[Supabase Auth - JWT]
        SBDB[(PostgreSQL Database)]
        RLS[Row Level Security]
    end

    FA --> AS
    FA --> SS
    FA --> LS
    FA --> DS
    AS -->|REST HTTPS| IDX
    SS -->|WebSocket| SOC

    RA --> AC
    AC -->|REST HTTPS| IDX
    RA -->|Direct| SBA

    IDX --> MW
    MW --> Routers
    IDX --> SOC
    SOC --> LSK

    AR --> SBA
    TR --> SBDB
    LR --> SBDB
    CR --> SBDB
    BR --> SBDB
    ER --> SBA
    ER --> SBDB
    DR --> SBDB
    HAV -.->|used by| TR

    SBDB --> RLS
```

---

## 4.3 Client-Server Interaction

### Mobile App → Backend
| Action | Channel | Endpoint |
|---|---|---|
| Login | REST POST | `/auth/login` |
| Start trip | REST POST | `/api/trips/start` |
| Pause/resume trip | REST PATCH | `/api/trips/:id/pause|resume` |
| Stream GPS (real-time) | WebSocket | `location:update` event |
| Batch upload GPS | REST POST | `/api/locations/batch` |
| End trip | REST POST | `/api/trips/:id/end` |
| Submit bundle | REST PATCH | `/api/bundles/:id/submit` |
| Fetch dashboard | REST GET | `/api/dashboard/employee` |

### Web Dashboard → Backend
| Action | Channel | Endpoint |
|---|---|---|
| Login | Direct Supabase SDK | Supabase Auth |
| Get employees | REST GET | `/api/employees` |
| Approve claim | REST PATCH | `/api/claims/:id/approve` |
| Receive location | WebSocket | `location:broadcast` event |
| Admin create user | REST POST | `/api/employees/create` |
| Admin assign manager | REST POST | `/api/employees/assignments` |

---

## 4.4 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client (Mobile/Web)
    participant B as Backend API
    participant SA as Supabase Auth
    participant DB as PostgreSQL (users table)

    C->>SA: signInWithPassword(email, password)
    SA-->>C: {access_token, refresh_token, user}
    C->>B: POST /auth/login {email, password}
    B->>SA: supabaseAnon.auth.signInWithPassword()
    SA-->>B: {session, user}
    B->>DB: SELECT id, email, role, full_name, rate_per_km WHERE id = user.id
    DB-->>B: profile row
    B-->>C: {access_token, refresh_token, user: profile}
    C->>C: Store tokens in AsyncStorage / Supabase session
    
    Note over C,B: Subsequent requests
    C->>B: GET /api/trips/active (Authorization: Bearer <token>)
    B->>SA: supabaseAdmin.auth.getUser(token)
    SA-->>B: {user}
    B->>DB: SELECT id, role, full_name, rate_per_km WHERE id = user.id
    DB-->>B: profile
    B->>B: req.user = profile
    B-->>C: 200 {data: trip}
```

---

## 4.5 Real-Time Communication Flow

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant SOC as Socket.IO Server
    participant BUF as Location Buffer (Memory)
    participant DB as PostgreSQL
    participant MGR as Manager Browser

    App->>SOC: connect({auth: {token}})
    SOC->>SOC: Verify JWT via supabaseAdmin
    SOC->>App: connected (joined user:userId room)
    MGR->>SOC: connect({auth: {token}})
    SOC->>SOC: role=MANAGER → join "managers" room

    loop Every 15 seconds (active trip)
        App->>App: fetchCurrentLocation() via expo-location
        App->>SOC: emit("location:update", {trip_id, lat, lng, ...})
        SOC->>SOC: Validate schema + speed (<200km/h)
        SOC->>BUF: Push to locationBuffer[]
        SOC->>MGR: emit("location:broadcast", {user_id, lat, lng})
    end

    loop Every 5 seconds
        BUF->>DB: INSERT INTO locations (batch flush)
        DB-->>BUF: OK
    end

    App->>SOC: emit("trip:ended", {trip_id, distance_km})
    SOC->>MGR: emit("trip:ended", {user_id, distance_km})
```

---

## 4.6 Monorepo Structure

The project uses a **monorepo with independent package.json** files per workspace (not Turborepo/Nx-managed). There is a `shared/` directory for shared TypeScript types (compiled separately). This is a pragmatic structure for a small team but lacks automated cross-workspace build orchestration.

```
FieldOps/
├── app/          ← Expo React Native (Employee mobile app)
├── backend/      ← Node.js Express API
├── web/          ← Vite React (Manager/Admin/Accountant dashboard)
├── shared/       ← Shared TypeScript types (dist/)
├── docs/         ← Project documentation
└── report/       ← Generated analysis report (this)
```
