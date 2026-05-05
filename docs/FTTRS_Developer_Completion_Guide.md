# FTTRS: Field Travel Tracking & Reimbursement System
## Developer Completion Guide
**Backend Audit Prompts • App Improvements • Web–App Sync Plan** *Based on actual screenshots of the working app (April 2026)*

---

## Executive Summary
| What we see | What's missing | Goal |
| :--- | :--- | :--- |
| Dashboard, Tracking map, Trip Details, Claims, Profile | Start/Pause/Stop buttons, Claim generation from trip | Complete app → hand off to web for manager view |

---

## 1. What You've Already Built — Screen-by-Screen Analysis
Based on the 8 screenshots shared, here is the current state of the application.

| Screen | Status | What's Working | What's Missing / Broken |
| :--- | :--- | :--- | :--- |
| **Dashboard** | ✅ Working | Online badge, trip status card, Start Trip button, mini map, pending claims, weekly compliance % | Distance shows 0.00 km (bug). 'Outside assigned geofence' warning always showing. |
| **Tracking** | ✅ Working | Google Maps live view, employee name label, checkpoint count, completed badge, layer toggle | Checkpoints: 0 (not implemented). Map state is stale — needs real-time Socket.IO sync. |
| **Trip Details (Map)** | ✅ Working | Route map embedded, COMPLETED badge, date, route length overlay | Route length 0.00 km. Map centered on Seattle (hardcoded) instead of actual location. |
| **Trip Details (Stats)** | ✅ Working | Stat cards: Total Distance, Duration, Avg Speed, Elevation Gain. Trip Timeline. | Total Distance 0.00 km. Elevation gain (184m) seems hardcoded. |
| **Trip Details (Timeline)** | ✅ Working | Visual timeline nodes, timestamps, named locations. '3 Claims Filed' row, '12 Photos' row. | Claims and Photos appear to be hardcoded demo data. Share button not functional. |
| **Claims** | ✅ Working | Expense Center header, pending approval amount card, + New Claim button | Pending amount INR 0.00. 'New Claim' likely not linked to a specific trip. |
| **Profile** | ✅ Working | Avatar, role label, edit button, Employee Profile (UUID visible), Security, Alerts, Region | Region shows 'Unknown'. UUID exposed on screen (should be employee code). |
| **Second Dashboard** | ✅ Working | Map at top, 4 stat cards: Trip Status, Today Distance, Pending Claims, Weekly Compliance | Today Distance 0.00 km. 0% compliance — logic not implemented. |

### 🔴 The #1 Critical Bug to Fix First
**Total Distance is 0.00 km on ALL screens.** This is the core of the whole system.
* **Root causes:** (a) GPS points not saving, (b) Haversine function not running at trip end, or (c) distance not written to `trips.total_distance_km`.
* **Fix:** Use **Prompt 1** below immediately. Everything else depends on this.

---

## 2. Backend Audit Prompts — Copy & Paste
*Paste these one at a time into your AI assistant (Claude/ChatGPT/Cursor) to fix the backend.*

### PROMPT 1: Distance Calculation Audit (Fix the 0.00 km bug)
I have a Node.js + Express + PostgreSQL backend for a GPS trip tracking app. The app records location points during a trip (table: locations with columns: trip_id, latitude, longitude, recorded_at). When the trip ends (POST /trips/:id/end), it should calculate total distance using the Haversine formula across all location points and write it to trips.total_distance_km.

Current problem: total_distance_km is always 0.00 after trip end. Please audit the following and fix all issues:
1. Show me the correct SQL query to fetch all location points for a trip ordered by recorded_at.
2. Write a TypeScript haversine function that takes an array of {latitude, longitude} objects and returns total km (filtering out noise < 5m).
3. Show me how to call this function inside the trip end handler and UPDATE the trips table.
4. Write a one-time SQL migration to recalculate total_distance_km for all existing completed trips.

### PROMPT 2: Trip Lifecycle Endpoints Audit
Audit my trip lifecycle backend for a React Native field tracking app. The app has these buttons: Start Trip, Pause, Resume, End Trip. I need you to verify and write these 4 Express endpoints in TypeScript:
1. **POST /api/trips/start**: Validate no active trip; create record (status="active").
2. **PATCH /api/trips/:id/pause**: Validate ownership/status; update to "paused"; record timestamp.
3. **PATCH /api/trips/:id/resume**: Validate status; update to "active"; calculate pause duration.
4. **POST /api/trips/:id/end**: Validate status; calculate distance; update status="completed"; auto-create claim; emit Socket.IO event.

### PROMPT 3: Real-Time Location Ingestion Audit
Audit my Socket.IO location ingestion pipeline (Node.js + Socket.IO v4 + PostgreSQL + Redis). Mobile app emits `location:update` every 15s. Write the handler for:
1. Auth middleware (JWT).
2. Room management.
3. Payload validation (Zod) + Mock GPS detection.
4. Batch buffer (flush to DB every 5s) + Redis live tracking update.
5. Broadcast to manager rooms.

---

## 3. App Improvement Plan

### 3.1 Critical UI Fixes
1. **Distance 0.00 km:** Fix Haversine logic in backend.
2. **Geofence Warning:** Hide 'Outside assigned geofence' until geofences are configured.
3. **Map Coordinates:** Remove hardcoded Seattle; pass actual trip coordinates.
4. **Hardcoded Data:** Replace '3 Claims/12 Photos' with real API calls.
5. **Profile ID:** Replace raw UUID with friendly `EMP-XXXX` code.

### 3.2 Missing Feature: Trip Control Buttons
**Required Flow:**
* **State 1 (No Trip):** Show 'Start Trip'.
* **State 2 (Active):** Show [Pause] and [End Trip] + Live Timer/Distance.
* **State 3 (Ended):** Show 'Generate Claim' button on Trip Details screen.

---

## 4. Web–App Sync Plan
The web dashboard (for Managers) consumes the data produced by the app.

| App Action | Backend Event | Web Dashboard Reaction |
| :--- | :--- | :--- |
| Start Trip | Socket.IO `trip:started` | New employee dot appears on live map. |
| GPS Update | Socket.IO `location:broadcast` | Employee dot moves on map; speed updates. |
| End Trip | POST `/trips/:id/end` | Dot greys out; new row in Claims queue. |
| Manager Approve | PATCH `/claims/:id/approve` | Claim moves to Approved; App receives push notification. |

---

## 5. Development Order
1.  **Week 1 (Backend):** Fix distance (Day 1), Lifecycle (Day 2), Socket.IO (Day 3), Claims (Day 4), DB Audit & Push (Day 5).
2.  **Week 2 (App UI):** Active Trip Screen (Day 6), Connect Sockets (Day 7), Claim Button (Day 8), Map Fixes (Day 9), Push Handling (Day 10).
3.  **Week 3 (Polish):** Offline queue, empty states, confirmation modals.

---

## 6. Testing Checklist
1.  **Login:** Get JWT.
2.  **Lifecycle:** Start → Send Locations → End.
3.  **Validation:** Verify `total_distance_km` > 0 in DB.
4.  **End-to-End:** Move on GPS → Verify dot moves on Manager Web → Generate Claim → Manager Approves → App gets Push.
