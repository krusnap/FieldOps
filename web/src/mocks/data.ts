import { Claim, Employee, TripHistoryItem } from "../types/domain";

export const managerOverview = {
  totalEmployees: 18,
  pendingClaims: 6,
  approvedClaims: 42,
  weeklyTravelSummaryKm: 1264,
};

export const employees: Employee[] = [
  {
    id: "emp-1001",
    name: "Ava Thompson",
    managerName: "Casey Morgan",
    designation: "Field Sales Executive",
    status: "traveling",
    activeTrips: 1,
    weeklyDistanceKm: 174,
    weeklyTrips: 9,
    claimsApproved: 7,
    claimsRejected: 1,
    city: "Austin",
  },
  {
    id: "emp-1002",
    name: "Noah Martinez",
    managerName: "Casey Morgan",
    designation: "Service Engineer",
    status: "idle",
    activeTrips: 0,
    weeklyDistanceKm: 128,
    weeklyTrips: 6,
    claimsApproved: 5,
    claimsRejected: 0,
    city: "Dallas",
  },
  {
    id: "emp-1003",
    name: "Sophia Williams",
    managerName: "Casey Morgan",
    designation: "Regional Associate",
    status: "traveling",
    activeTrips: 2,
    weeklyDistanceKm: 216,
    weeklyTrips: 11,
    claimsApproved: 9,
    claimsRejected: 1,
    city: "Houston",
  },
  {
    id: "emp-1004",
    name: "Liam Patel",
    managerName: "Casey Morgan",
    designation: "Implementation Specialist",
    status: "offline",
    activeTrips: 0,
    weeklyDistanceKm: 84,
    weeklyTrips: 4,
    claimsApproved: 3,
    claimsRejected: 1,
    city: "San Antonio",
  },
];

export const claims: Claim[] = [
  {
    id: "clm-501",
    employeeId: "emp-1001",
    employeeName: "Ava Thompson",
    date: "2026-04-07",
    amount: 182.5,
    distanceKm: 94,
    durationMin: 174,
    status: "pending",
    route: { origin: "Austin HQ", destination: "Round Rock Client Office" },
    reason: "Client onsite product demo and follow-up",
  },
  {
    id: "clm-502",
    employeeId: "emp-1003",
    employeeName: "Sophia Williams",
    date: "2026-04-06",
    amount: 244.3,
    distanceKm: 132,
    durationMin: 205,
    status: "approved",
    route: { origin: "Houston Hub", destination: "Sugar Land Plant" },
    reason: "Site inspection and KPI review",
  },
  {
    id: "clm-503",
    employeeId: "emp-1002",
    employeeName: "Noah Martinez",
    date: "2026-04-05",
    amount: 76.0,
    distanceKm: 38,
    durationMin: 62,
    status: "rejected",
    route: { origin: "Dallas Center", destination: "Plano Retail Site" },
    reason: "Missing trip evidence in previous submission",
  },
  {
    id: "clm-504",
    employeeId: "emp-1003",
    employeeName: "Sophia Williams",
    date: "2026-04-07",
    amount: 128.75,
    distanceKm: 72,
    durationMin: 103,
    status: "pending",
    route: { origin: "Houston Hub", destination: "Katy Service Point" },
    reason: "Urgent client support visit",
  },
  {
    id: "clm-505",
    employeeId: "emp-1004",
    employeeName: "Liam Patel",
    date: "2026-04-08",
    amount: 208.1,
    distanceKm: 106,
    durationMin: 160,
    status: "approved",
    route: { origin: "San Antonio North", destination: "Boerne Plant" },
    reason: "Field implementation milestone validation",
  },
];

export const tripHistory: TripHistoryItem[] = [
  {
    id: "trp-901",
    employeeId: "emp-1001",
    date: "2026-04-07",
    origin: "Austin HQ",
    destination: "Round Rock Client Office",
    distanceKm: 94,
    durationMin: 174,
  },
  {
    id: "trp-902",
    employeeId: "emp-1001",
    date: "2026-04-05",
    origin: "Austin HQ",
    destination: "Georgetown Warehouse",
    distanceKm: 42,
    durationMin: 78,
  },
  {
    id: "trp-903",
    employeeId: "emp-1003",
    date: "2026-04-06",
    origin: "Houston Hub",
    destination: "Sugar Land Plant",
    distanceKm: 132,
    durationMin: 205,
  },
  {
    id: "trp-904",
    employeeId: "emp-1002",
    date: "2026-04-04",
    origin: "Dallas Center",
    destination: "Plano Retail Site",
    distanceKm: 38,
    durationMin: 62,
  },
];

export const travelTrend = [
  { label: "Mon", value: 160 },
  { label: "Tue", value: 210 },
  { label: "Wed", value: 196 },
  { label: "Thu", value: 240 },
  { label: "Fri", value: 282 },
  { label: "Sat", value: 110 },
  { label: "Sun", value: 66 },
];

export const activityMetrics = [
  { label: "Trips", value: 58 },
  { label: "Approvals", value: 42 },
  { label: "Rejections", value: 8 },
  { label: "Active Routes", value: 14 },
];

export const adminOverview = {
  totalUsers: 76,
  activeEmployees: 54,
  totalTrips: 1204,
  claimsProcessed: 876,
};

export const users = [
  { id: "usr-1", name: "Casey Morgan", role: "Manager", status: "Active" },
  { id: "usr-2", name: "Jordan Lee", role: "Admin", status: "Active" },
  { id: "usr-3", name: "Taylor Brooks", role: "Accountant", status: "Active" },
  { id: "usr-4", name: "Ava Thompson", role: "Employee", status: "Active" },
  { id: "usr-5", name: "Noah Martinez", role: "Employee", status: "Inactive" },
  { id: "usr-6", name: "Sophia Williams", role: "Employee", status: "Active" },
];

export const managerAssignments = [
  { manager: "Casey Morgan", employees: ["Ava Thompson", "Noah Martinez", "Sophia Williams"] },
  { manager: "Riley Carter", employees: ["Liam Patel", "Mia Chen"] },
];

export const permissionMatrix = [
  { key: "viewClaims", label: "View Claims", manager: true, admin: true, accountant: true },
  { key: "approveClaims", label: "Approve or Reject Claims", manager: true, admin: true, accountant: false },
  { key: "manageUsers", label: "Manage Users", manager: false, admin: true, accountant: false },
  { key: "viewAnalytics", label: "View Analytics", manager: true, admin: true, accountant: false },
];

export const systemMetrics = [
  { label: "API Latency (ms)", value: 148 },
  { label: "Queue Backlog", value: 23 },
  { label: "Error Rate (%)", value: 0.7 },
  { label: "Active Sessions", value: 129 },
];
