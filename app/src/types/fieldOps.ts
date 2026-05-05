export type UserRole = "employee" | "admin" | "manager" | "accountant";
export type TripStatus = "idle" | "active" | "paused" | "completed";

export type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number | null;
};

export type EmployeeTask = {
  time: string;
  title: string;
  place: string;
};

export type EmployeeCheckpoint = {
  label: string;
  eta: string;
};

export type EmployeeClaim = {
  id: string;
  category: string;
  amountInr: number;
  status: "Pending" | "Approved" | "Submitted" | "Review";
  tripId?: string;
  createdAt: string;
};

export type EmployeeUser = {
  employeeId: string;
  email: string;
  name: string;
  title: string;
  region: string;
  pendingActions: number;
  weeklyCompliance: string;
  tasks: EmployeeTask[];
  checkpoints: EmployeeCheckpoint[];
  geofenceCenter: { latitude: number; longitude: number };
  geofenceRadiusMeters: number;
};

export type EmployeeAccountRecord = EmployeeUser & {
  password: string;
  role: UserRole;
  initialClaims: EmployeeClaim[];
};

export type TripRecord = {
  tripId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceKm: number;
  path: LocationPoint[];
};

export type FieldAlerts = {
  outsideGeofence: boolean;
  offline: boolean;
  gpsDisabled: boolean;
  lowBattery: boolean;
};

export type NetworkState = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
};
