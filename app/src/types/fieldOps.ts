export type UserRole = "employee" | "admin" | "manager" | "accountant";
export type TripStatus = "idle" | "active" | "paused" | "completed";

export type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number | null;
};

export type EmployeeClaim = {
  id: string;
  category: string;
  amountInr: number;
  status: "Pending" | "Approved" | "Rejected";
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
  geofenceCenter: { latitude: number; longitude: number };
  geofenceRadiusMeters: number;
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
