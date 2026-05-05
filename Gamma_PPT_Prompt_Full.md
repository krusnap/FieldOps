# Gamma.ai Prompt — FieldOps Internship PPT (Expanded · 25 Slides)

> **How to use:**
> Go to [gamma.app](https://gamma.app) → New → **Generate from text/outline**
> Paste everything below the separator line into the text box.
> Choose theme: **Dark Professional** or **Corporate Tech** (dark navy/charcoal, teal/blue accents).
> Set slide count to **25** (or "Auto — use all content").

---

## ─── PASTE BELOW INTO GAMMA ───

Create a 25-slide professional internship presentation. Use a dark modern corporate tech theme: dark navy or charcoal background, teal (#00BFA5) or electric blue (#4FC3F7) accent colors, clean modern sans-serif font (Inter, Poppins, or Outfit). Vary the layout meaningfully across slides — avoid repeating the same layout more than twice in a row. Keep bullet points short (max 8 words each). Where "[ Screenshot Placeholder ]" is written, insert an empty image box with that label — do not use stock photos.

---

### Slide 1 — Title Slide

**Title:** FieldOps
**Subtitle:** Field Travel Tracking & Reimbursement System
**Label:** April 2026 Internship Presentation

**Presented by:** Krushna Sanjay Sanap — Roll No. 59
**Company:** Mahindra EPC Irrigation Ltd.
**College Mentors:** Dr. Preeti Bhamre | Prof. Poonam Patil
**Industry Mentor:** Ms. Saloni Waghmare

Layout: Large bold title centered on a dark background. Teal gradient accent bar on the left or a glowing teal underline. Student name and mentor details in smaller text at the bottom in two rows.

---

### Slide 2 — Agenda

**Heading:** What We'll Cover Today

Numbered list:
1. Problem Statement & Project Goal
2. System Architecture
3. Tech Stack
4. Backend — What Was Built
5. Mobile App — Employee Experience
6. Web Dashboard — Three Portals
7. End-to-End Trip Flow
8. Database Design Highlights
9. Key Technical Challenges
10. Remaining Work & Next Steps
11. Learnings & Takeaways
12. Demo & Q&A

Layout: Clean numbered list. Two columns if needed. Teal numbering or bullet accents.

---

### Slide 3 — Problem Statement

**Heading:** The Problem

**Context:**
Field employees at Mahindra EPC Irrigation travel daily for site visits, client meetings, and installation work across various locations.

**The Pain Points:**
- Trip distances were recorded manually — prone to errors and disputes
- Reimbursement claims took days or weeks to process
- Managers had zero real-time visibility into where employees were
- No audit trail for travel compliance or expense verification
- Spreadsheet-based tracking was time-consuming and unreliable

Layout: Large bold heading. Pain points as a vertical list with red/warning bullet icons. Optional: a simple illustration or icon on the right (a broken clipboard or a map pin with a question mark).

---

### Slide 4 — Project Goal & Vision

**Heading:** The Solution — FieldOps

**Goal:** Build a unified, automated field operations platform that:
- Tracks employee trips live via GPS with zero manual input
- Accurately calculates travel distance using server-side computation
- Auto-generates reimbursement claims the moment a trip ends
- Gives managers real-time visibility through a live tracking dashboard
- Gives accountants a clean workflow to process and approve claims

**Vision:** Replace paperwork and guesswork with an integrated, data-driven field operations system.

Layout: Two columns — Left: goal bullets with teal checkmarks. Right: vision statement in a large quote block or highlighted card. Bold and inspiring.

---

### Slide 5 — System Architecture Overview

**Heading:** System Architecture

**Three-Tier Architecture:**

**📱 Mobile App**
- Platform: React Native (Expo)
- Users: Field Employees
- Role: Trip control, GPS tracking, claim viewing

**⚙️ Backend API**
- Platform: Node.js + Express
- Database: Supabase (PostgreSQL)
- Communication: REST API + Socket.IO
- Role: Business logic, data storage, real-time relay

**🌐 Web Dashboard**
- Platform: React + Vite
- Users: Admin, Manager, Accountant
- Role: Monitoring, approval, analytics

**Data Flow:**
Employee (Mobile) → GPS + Trip Events → Backend API → Supabase DB
Backend → Socket.IO → Manager Web Dashboard (live map)
Manager/Accountant → REST → Backend → Claim approval

Layout: Horizontal three-box architecture diagram with labeled arrows. Each box has an icon, platform label, and 2–3 bullets. Clear and structured.

---

### Slide 6 — Tech Stack

**Heading:** Technologies Used

**Mobile App**
- React Native + Expo
- Expo Location (GPS)
- React Native Maps
- Axios + Socket.IO Client

**Backend**
- Node.js + Express.js
- Supabase (PostgreSQL + Auth)
- Socket.IO (WebSockets)
- JWT Authentication
- Haversine Formula (distance calc)

**Web Dashboard**
- React + Vite
- React Router (role-based routing)
- Recharts (analytics charts)
- Leaflet / Mapbox (maps)
- Axios

**Dev Tools**
- VS Code, Git, GitHub
- Postman (API testing)
- pgAdmin (DB management)

Layout: Four-column card layout or a 2×2 grid. Each card has a category title, icon, and tech list. Use teal borders or accent colors per column.

---

### Slide 7 — Backend: Authentication & Authorization

**Heading:** Backend — Auth & Security

**Authentication (Supabase)**
- Employee login with email and password
- Supabase issues JWT access + refresh tokens
- Token refresh endpoint keeps sessions alive
- Logout invalidates session on server

**Authorization (Role-Based)**
- Every API route checks the user's role from the JWT
- Roles: Employee, Manager, Admin, Accountant
- Middleware blocks unauthorized access before reaching route handlers
- Custom error messages returned for forbidden access

**Error Handling**
- Centralized error handler catches all thrown errors
- Consistent JSON error response format across all routes
- Differentiates between 400 (bad input), 401 (unauth), 403 (forbidden), 500 (server)

Layout: Three vertical sections with section headers and bullet lists. Use teal section dividers or colored left-border cards.

---

### Slide 8 — Backend: Trip Lifecycle APIs

**Heading:** Backend — Trip Management

**The Trip Lifecycle:**

**POST /trips/start**
Creates a new trip record, sets status to "active", records start time and location.

**POST /trips/pause**
Updates trip status to "paused", records pause timestamp.

**POST /trips/resume**
Sets status back to "active", records resume timestamp.

**POST /trips/end**
Sets status to "completed", triggers distance calculation and claim auto-creation.

**GET /trips/active**
Returns the currently active trip for the authenticated employee.

**GET /trips/history**
Returns paginated list of past trips for the employee.

**GET /trips/:id**
Returns full trip detail including GPS path, distance, and linked claim.

Layout: Horizontal flow showing START → PAUSE → RESUME → END as a state machine. Below: API endpoint table with method, route, and purpose. Clean and readable.

---

### Slide 9 — Backend: Real-Time Location & Socket.IO

**Heading:** Backend — Live Location Tracking

**Two Ingestion Methods:**

**REST Batch Upload**
- Mobile app batches GPS points every N seconds
- POST /locations/batch → array of {lat, lng, timestamp, tripId}
- Stored in the locations table in Supabase
- Used for distance calculation at trip end

**Socket.IO Live Events**
- Employee connects with JWT auth on trip start
- Emits "location:update" events with coordinates
- Backend validates and rebroadcasts to the manager's room
- Manager's web dashboard receives live updates without polling

**Socket.IO Rooms**
- Each manager has a dedicated room: "manager:{managerId}"
- Employees under that manager auto-join the room
- Allows targeted real-time broadcasting per team

Layout: Two-column layout. Left: REST batch flow diagram. Right: Socket.IO event flow diagram. Both with labeled arrows.

---

### Slide 10 — Backend: Distance Calculation & Claims

**Heading:** Backend — Distance & Auto-Claims

**Distance Calculation**
- On trip end, backend fetches all GPS points for that trip from the DB
- Applies the Haversine formula between each consecutive pair of coordinates
- Sums all segment distances to get the total trip distance in kilometers
- Stores the final distance value in the trip record

**Haversine Formula**
Calculates the great-circle distance between two points on the Earth's surface using latitude and longitude. Accounts for Earth's curvature — more accurate than simple Euclidean distance.

**Auto-Claim Creation**
- Immediately after distance is computed, a reimbursement claim is auto-created
- Claim is linked to the trip ID and the employee ID
- Initial status: "Pending" — awaiting manager review
- Rate per km is configurable (company policy)

**Claims APIs**
- GET /claims — list all claims (filtered by role)
- GET /claims/:id — claim detail
- POST /claims/:id/approve — manager approves
- POST /claims/:id/reject — manager rejects with reason

Layout: Two sections. Top: Distance calc with a small formula visual. Bottom: Auto-claim flow as a left-to-right mini pipeline (Trip Ends → Distance Calc → Claim Created → Pending Review).

---

### Slide 11 — Mobile App: Login & Dashboard

**Heading:** Mobile App — Login & Home Dashboard

**Login Screen**
- Employee enters email and password
- Authenticates against the backend (Supabase under the hood)
- Demo fallback available for offline/testing scenarios
- On success: JWT stored securely, user redirected to dashboard

**Home Dashboard**
- Greeting with employee name
- Current trip status card (active / paused / idle)
- Total distance covered (today / all time)
- Pending claims count
- Compliance score indicator
- Alert banners (network, battery, geofence)
- Mini map preview of last known location

[ Screenshot Placeholder — Login Screen ]
[ Screenshot Placeholder — Dashboard Screen ]

Layout: Two-column. Left: Login screen description + placeholder. Right: Dashboard description + placeholder.

---

### Slide 12 — Mobile App: Trip Controls & GPS

**Heading:** Mobile App — Trip Controls & GPS Tracking

**Trip Control Flow:**

**Start Trip**
- Employee taps "Start Trip"
- App requests location permissions if not granted
- Begins GPS polling at a set interval (e.g., every 10–30 seconds)
- API call to backend: POST /trips/start

**During Trip**
- GPS coordinates logged continuously
- Coordinates batched and uploaded every N seconds via REST
- Live coordinates also sent via Socket.IO
- Route polyline builds up on the tracking map

**Pause Trip**
- GPS polling halted
- API call: POST /trips/pause
- UI shows "Paused" badge

**Resume Trip**
- GPS polling restarts
- API call: POST /trips/resume

**End Trip**
- Final location batch uploaded
- API call: POST /trips/end
- Backend calculates distance and creates claim
- Employee sees trip summary

[ Screenshot Placeholder — Trip Controls Screen ]

Layout: Vertical numbered step flow on the left. Screenshot placeholder on the right.

---

### Slide 13 — Mobile App: Tracking Screen & Map

**Heading:** Mobile App — Live Tracking Screen

**What the Employee Sees:**
- Full-screen interactive map (React Native Maps)
- Real-time route polyline drawn as GPS points come in
- Checkpoint markers at key locations (pauses, waypoints)
- Current location pin with accuracy radius indicator
- Map controls: zoom in/out, re-center, toggle satellite view

**Route Visualization:**
- Polyline color changes from start to end (gradient or solid)
- Checkpoints shown as numbered markers
- Trip start and trip end markers clearly differentiated

**Map Controls:**
- Pan and zoom freely while tracking continues in background
- "Re-center" button to snap back to current location
- Optional: Share location button

[ Screenshot Placeholder — Tracking Map Screen ]

Layout: Description on left. Large screenshot placeholder on right.

---

### Slide 14 — Mobile App: Claims, Trip Details & Alerts

**Heading:** Mobile App — Claims, Details & Smart Alerts

**Claims Screen**
- List of all reimbursement claims for the employee
- Each entry shows: trip date, distance, amount, status badge (Pending / Approved / Rejected)
- Tap to view full claim detail

**Trip Details Screen**
- Trip summary: start time, end time, total duration, total distance
- Visual timeline of events (start, pauses, resume, end)
- Linked claim card showing amount and approval status

**Profile Screen**
- Employee name, ID, role, department
- Logout button

**Smart Alert System**
- 📶 Network loss — warns employee that GPS data may not upload
- 🔋 Low battery — suggests ending trip soon
- 📍 Geofence violation — alerts if employee goes outside designated area

[ Screenshot Placeholder — Claims Screen ]
[ Screenshot Placeholder — Trip Details Screen ]

Layout: Four small feature sections in a 2×2 card layout. Screenshots as small placeholders in each card.

---

### Slide 15 — Web App: Architecture & Role Routing

**Heading:** Web Dashboard — Architecture

**Built With:**
- React + Vite for fast development and builds
- React Router for client-side navigation
- Shared app shell: persistent sidebar, top header, notification area

**Role-Based Routing:**
- On login, user role is read from the JWT
- Router redirects to the appropriate portal:
  - Admin → /admin/*
  - Manager → /manager/*
  - Accountant → /accountant/*
- Unauthorized routes automatically redirect to login

**Shared UI Components:**
- Stat cards (number, label, trend indicator)
- Data tables with column sorting and text filtering
- Recharts-based bar, line, and pie charts
- Leaflet map component for employee locations
- Claim status badges, loading skeletons, modal dialogs

Layout: Left: role routing flowchart (Login → Role Check → Portal). Right: shared components list with small icons.

---

### Slide 16 — Admin Portal

**Heading:** Admin Portal — System Control

**Who uses it:** System administrators

**User Management**
- View all registered employees
- Create, edit, deactivate user accounts
- Assign roles (Employee, Manager, Admin, Accountant)

**Manager Control**
- Assign employees to managers
- View manager-wise team structure

**Permissions**
- Configure which roles can access which features
- Toggle feature flags

**Analytics**
- Company-wide trip statistics
- Total distance, claims volume, approval rates
- Monthly trend charts

**System Monitoring**
- Backend health indicators
- Active Socket.IO connections
- Error log viewer

**Data Viewer**
- Raw table view for trips, claims, locations
- Export to CSV

[ Screenshot Placeholder — Admin Portal Dashboard ]

Layout: Two columns. Left: feature list with icons. Right: screenshot placeholder.

---

### Slide 17 — Manager Portal

**Heading:** Manager Portal — Team Operations

**Who uses it:** Team managers overseeing field employees

**Dashboard**
- Summary cards: active employees, trips today, pending claims, total distance
- Quick links to employee list and claims

**Live Employee Tracking**
- Map showing real-time positions of all active field employees
- Each employee shown as a labeled pin
- Updates live via Socket.IO without page refresh

**Employee List & Detail**
- Table of all assigned employees with current status
- Click employee → detail page with trip history, claim history, compliance score

**Claims Review**
- Table of all claims from team members
- Filter by status: Pending, Approved, Rejected, All
- Click claim → full detail page with trip route and distance

**Claim Detail & Action**
- Full claim info: employee, trip date, distance, amount
- Approve or Reject with optional reason

**Reports**
- Team performance over time
- Distance per employee, claims per week, compliance trends

[ Screenshot Placeholder — Manager Dashboard ]

Layout: Left: feature bullets with icons. Right: screenshot placeholder. Bold section labels.

---

### Slide 18 — Accountant Portal

**Heading:** Accountant Portal — Reimbursements

**Who uses it:** Finance/accountant team processing payments

**Dashboard**
- Total pending reimbursement value (₹)
- Approved vs rejected ratio
- Claims processed this month

**Claims Table**
- Full list of all claims across all employees
- Columns: Employee, Trip Date, Distance, Amount, Status, Manager Decision
- Filters: date range, status, employee name

**Claim Detail View**
- Full claim audit trail
- Trip route summary and distance
- Manager approval/rejection reason visible
- Accountant can mark as "Paid" after processing

**Analytics**
- Approved vs rejected claims chart
- Monthly reimbursement spend trend
- Per-employee reimbursement breakdown

[ Screenshot Placeholder — Accountant Claims Table ]

Layout: Two columns. Left: feature bullets. Right: screenshot placeholder.

---

### Slide 19 — End-to-End Trip Flow

**Heading:** Full Trip Lifecycle — Start to Reimbursement

Show a vertical or horizontal numbered flow with 8 steps:

**Step 1 — Employee Login**
Authenticates via backend → JWT issued → Stored on device

**Step 2 — Start Trip**
Taps "Start Trip" on mobile → Backend creates trip record → GPS polling begins

**Step 3 — GPS Tracking**
GPS polled every N seconds → Batched and uploaded to backend (REST) + streamed via Socket.IO

**Step 4 — Manager Visibility**
Backend broadcasts live location to manager's Socket.IO room → Manager sees pin moving on map

**Step 5 — End Trip**
Employee taps "End Trip" → Last batch uploaded → Backend fetches all GPS points

**Step 6 — Distance Calculated**
Haversine formula applied across all points → Total distance computed and saved to DB

**Step 7 — Claim Auto-Created**
Backend creates reimbursement claim: status = Pending, amount = distance × rate

**Step 8 — Review & Approval**
Manager reviews claim → Approves or Rejects → Accountant marks as Paid

Layout: Horizontal or vertical numbered pipeline. Each step in a box with an icon and 1-line description. Arrows between steps. Color progress from teal (start) to gold (paid).

---

### Slide 20 — Database Design Highlights

**Heading:** Database — Key Tables

**Supabase (PostgreSQL) Schema — Key Tables:**

**users**
id, email, role, name, manager_id, created_at

**trips**
id, employee_id, status, start_time, end_time, distance_km, start_location, end_location

**locations**
id, trip_id, employee_id, latitude, longitude, timestamp

**claims**
id, trip_id, employee_id, amount, status (pending/approved/rejected), manager_id, reason, created_at

**Relationships:**
- users → trips (one employee, many trips)
- trips → locations (one trip, many GPS points)
- trips → claims (one trip, one auto-generated claim)
- users (manager) → claims (manager reviews many claims)

Layout: Left: table definitions in a clean monospace-style card. Right: simple entity-relationship diagram with arrows. Teal accents on table names.

---

### Slide 21 — Key Technical Challenges

**Heading:** Technical Challenges & How We Solved Them

Present as a problem → solution card layout (3 challenges):

**Challenge 1: Real-Time Location Without Polling**
- Problem: Constant REST polling is battery-intensive and adds server load
- Solution: Implemented Socket.IO with JWT-authenticated rooms; only emits when location changes

**Challenge 2: Accurate Distance Calculation**
- Problem: Simple straight-line distance ignores road geometry and GPS noise
- Solution: Applied Haversine formula on all sequential GPS waypoints server-side; accumulated incremental distances

**Challenge 3: Role-Based Access Across Three Portals**
- Problem: Admin, Manager, Accountant see different data and pages; mixing logic causes bugs
- Solution: Centralized role check middleware on backend; role-based React Router guards on frontend with isolated portal components

Layout: Three horizontal or vertical cards. Each card: Problem in red/orange, Solution in teal/green. Icon per challenge.

---

### Slide 22 — Current Issues & Known Gaps

**Heading:** Known Issues

**🔴 Critical**
- Distance showing 0.00 km on some trips
  - Root cause: GPS location batch may not be uploaded before trip end API is called
  - Fix: Ensure final batch upload completes before triggering trip end

**🟡 Medium**
- Some hardcoded/demo data still present in the UI
- Geofence alert logic incomplete — needs zone configuration
- Map auto-centering loses position when new points arrive rapidly

**🟢 Minor**
- Share/export trip route not yet implemented
- Profile screen edit capability not built
- No dark/light mode toggle in web dashboard

Layout: Three colored card sections (red, amber, green) with issues listed per severity level. Clean and professional.

---

### Slide 23 — Next Steps & Roadmap

**Heading:** Roadmap — What Comes Next

Present as a phase-based roadmap:

**Phase 1 — Bug Fixes (Immediate)**
- Fix 0.00 km distance bug
- Replace all hardcoded UI data with live API calls
- Complete geofence zone configuration

**Phase 2 — Testing & Quality**
- Write automated tests for all backend routes
- Test distance calculation accuracy against real GPS data
- Add Socket.IO connection and event tests

**Phase 3 — DevOps & CI/CD**
- Set up GitHub Actions pipeline (lint → test → build)
- Containerize backend with Docker
- Write deployment documentation and environment guides

**Phase 4 — Scaling & Production**
- Add Redis adapter for Socket.IO horizontal scaling
- Add monitoring (logs, error tracking, uptime alerts)
- Load test API under concurrent field employee simulation

Layout: Four vertical phases with timeline-style layout. Each phase has a color-coded label and bullet list. Teal progress bar or phase indicator.

---

### Slide 24 — Learnings & Takeaways

**Heading:** What I Learned

**Technical Skills Gained:**
- Full-stack development with React Native, Node.js, and PostgreSQL
- Real-time communication using Socket.IO WebSockets
- GPS tracking and location data processing
- Role-based auth with JWT and Supabase
- API design and backend architecture patterns

**Product Thinking:**
- Designing for three distinct user roles with different workflows
- Understanding how field operations software solves real business problems
- Balancing MVP scope with production readiness

**Professional Growth:**
- Working within a corporate engineering environment at Mahindra EPC
- Communicating technical decisions to non-technical stakeholders
- Planning, breaking down, and executing a multi-layer project independently

Layout: Three columns: Technical / Product / Professional. Each has an icon and bullet list. Clean and confident.

---

### Slide 25 — Demo & Thank You

**Heading:** Thank You

**Left half:**
[ Screenshot Placeholder — App or Dashboard Demo ]

**Right half:**

**Project:** FieldOps — Field Travel Tracking & Reimbursement System
**Stack:** React Native · Node.js · Express · Supabase · Socket.IO · React
**Database:** PostgreSQL via Supabase
**Real-Time:** Socket.IO with JWT rooms

**Presented by:** Krushna Sanjay Sanap (Roll No. 59)
**Company:** Mahindra EPC Irrigation Ltd.
**College Mentors:** Dr. Preeti Bhamre | Prof. Poonam Patil
**Industry Mentor:** Ms. Saloni Waghmare

Large bottom text: **"Open for Questions"**

Layout: Clean dark closing slide. Teal accents. Screenshot placeholder on the left. Summary and mentors on the right. "Open for Questions" in large teal text at the bottom.

---

**Global Design Notes for Gamma:**
- Background: Dark navy (#0D1B2A) or deep charcoal (#1A1A2E)
- Primary Accent: Teal (#00BFA5) or Electric Blue (#4FC3F7)
- Secondary Accent: Amber/Gold (#FFB300) for highlights and warnings
- Font: Inter, Poppins, or Outfit (modern, clean, professional)
- Icons: Flat minimal icon style throughout (Phosphor, Heroicons style)
- Slide count: 25 slides — use all content above
- Screenshot placeholders: Leave image boxes empty with the label text — absolutely no stock photos
- Tone: Professional, technical, internship presentation for college audience
- Consistency: Use the same teal accent and heading style across all slides
