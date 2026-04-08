export type AppRole = "manager" | "admin" | "accountant";

export type EmployeeStatus = "traveling" | "idle" | "offline";
export type ClaimStatus = "approved" | "rejected" | "pending";

export interface Employee {
  id: string;
  name: string;
  managerName: string;
  designation: string;
  status: EmployeeStatus;
  activeTrips: number;
  weeklyDistanceKm: number;
  weeklyTrips: number;
  claimsApproved: number;
  claimsRejected: number;
  city: string;
}

export interface TripHistoryItem {
  id: string;
  employeeId: string;
  date: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
}

export interface Claim {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  distanceKm: number;
  durationMin: number;
  status: ClaimStatus;
  route: {
    origin: string;
    destination: string;
  };
  reason: string;
}
