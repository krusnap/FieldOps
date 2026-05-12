# Section 2: Project Overview

## 2.1 Problem Statement

Field-based organizations face a universal operational challenge: employees who travel extensively during working hours must track and report their travel for reimbursement, but existing solutions are:

- **Manual and trust-based** — odometer readings, handwritten logs, or self-reported distances
- **Delayed** — paper forms submitted weekly or monthly create cash-flow problems for employees
- **Opaque** — managers have no real-time visibility into where their team members are
- **Fraud-prone** — inflated mileage is one of the most common forms of employee expense fraud
- **Disconnected** — travel tracking, claim submission, manager approval, and accounting are handled by different tools or spreadsheets

FieldOps replaces this fragmented process with a single integrated platform that is objective (GPS-verified), automated (claims generated on trip completion), transparent (real-time manager visibility), and auditable (immutable database records with reviewer identity logged).

---

## 2.2 Objectives

| # | Objective | Implementation Status |
|---|---|---|
| 1 | Automatically record GPS-verified employee travel | ✅ 15-sec polling + batch REST + Socket.IO |
| 2 | Calculate accurate distances using proven algorithm | ✅ Server-side Haversine with noise filtering |
| 3 | Auto-generate reimbursement claims on trip completion | ✅ Compensating pattern in `trips.router.ts` |
| 4 | Provide structured daily bundle approval workflow | ✅ Draft → Pending → Approved/Rejected |
| 5 | Give managers real-time field visibility | ✅ Socket.IO `location:broadcast` to managers room |
| 6 | Give admins full user/policy control | ✅ CRUD endpoints + role assignment |
| 7 | Support accountant read-only financial reporting | ✅ Dedicated accountant dashboard |
| 8 | Secure all data with JWT + RBAC | ✅ authenticate + requireRole middleware |

---

## 2.3 Target Users

### User 1 — Field Employee (Mobile App)
- **Device**: Android / iOS smartphone
- **Primary need**: Start/stop GPS tracking, submit claims, view reimbursement status
- **Key pain**: Wants a simple one-tap experience; does not want to manually log anything
- **Technical level**: Non-technical end user

### User 2 — Manager (Web Dashboard)
- **Device**: Desktop/laptop browser
- **Primary need**: Review and approve/reject employee claims; monitor field activity
- **Key pain**: Currently approves claims blindly; wants GPS-backed evidence
- **Technical level**: Moderate; familiar with dashboards

### User 3 — Administrator (Web Dashboard)
- **Device**: Desktop/laptop browser
- **Primary need**: Onboard employees, configure rates, assign reporting lines
- **Key pain**: Managing multiple employees across departments without a central system
- **Technical level**: Moderate-to-high; configures system policies

### User 4 — Accountant (Web Dashboard)
- **Device**: Desktop/laptop browser
- **Primary need**: View financial summaries of approved reimbursements for payroll processing
- **Key pain**: Reconciling paper claims with actual payroll disbursements
- **Technical level**: Moderate

---

## 2.4 Key Modules

| Module | Location | Description |
|---|---|---|
| Authentication | `backend/src/modules/auth/` | Login, refresh, logout, /me |
| Trip Lifecycle | `backend/src/modules/trips/` | Start, pause, resume, end, history |
| GPS Location | `backend/src/modules/locations/` | Batch REST upload + Socket.IO stream |
| Claims Engine | `backend/src/modules/claims/` | Draft/pending/approve/reject + override |
| Bundle Manager | `backend/src/modules/claims/bundles.router.ts` | Daily claim grouping + submit/approve/reject |
| Employee Mgmt | `backend/src/modules/employees/` | CRUD, assignment, stats |
| Dashboard APIs | `backend/src/modules/dashboard/` | Role-specific aggregated stats |
| Mobile App | `app/src/` | React Native Expo application |
| Web Dashboard | `web/src/` | React + Vite web application |
| Database | `backend/migrations/` | PostgreSQL + RLS via Supabase |

---

## 2.5 Scope Boundaries

### In Scope (Implemented)
- GPS tracking via Expo Location API (foreground)
- REST API for all CRUD operations
- WebSocket real-time location streaming
- 4-role access control (Employee, Manager, Admin, Accountant)
- Automated claim generation with configurable rate_per_km
- Daily claim bundles with hierarchical approval
- Manager claim override (correct rejected claims)
- Admin user creation via Supabase Auth Admin API

### Out of Scope (Planned / Future)
- Background GPS tracking when app is in background/killed state
- Push notifications (FCM/APNs)
- OCR receipt scanning for fuel expenses
- AI-based fraud detection
- Route optimization suggestions
- Offline queue with automatic sync on reconnect
- Multi-currency support
- Department / team hierarchy
- Payroll system integration
