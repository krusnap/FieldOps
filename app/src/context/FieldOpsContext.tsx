import * as Battery from "expo-battery";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { ClaimData, TripData, LocationPointPayload, clearAuthSession, storeAuthSession } from "../services/api";
import { supabase } from "../lib/supabase";
import { haversineDistanceMeters, isOutsideGeofence, shouldIgnoreLocationPoint } from "../services/distance";
import { ensureLocationPermission, fetchCurrentLocation } from "../services/location";
import { connectSocket, emitLocationUpdate, emitTripStarted, emitTripEnded, disconnectSocket } from "../services/socketService";
import {
  EmployeeClaim,
  EmployeeUser,
  FieldAlerts,
  LocationPoint,
  NetworkState,
  TripRecord,
  TripStatus
} from "../types/fieldOps";

const LOCATION_POLL_MS = 15000;
const NETWORK_POLL_MS = 10000;
const BATTERY_POLL_MS = 60000;
const LOCATION_BATCH_SIZE = 4;

type FieldOpsContextValue = {
  alerts: FieldAlerts;
  claims: EmployeeClaim[];
  currentLocation: LocationPoint | null;
  elapsedSeconds: number;
  endTrip: () => void;
  gpsPointsCount: number;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  network: NetworkState;
  path: LocationPoint[];
  pauseTrip: () => void;
  pendingClaimAmountInr: number;
  primaryActionLabel: "Start Trip" | "Pause Trip" | "Resume Trip";
  resumeTrip: () => void;
  refreshCurrentLocation: () => Promise<LocationPoint | null>;
  startTrip: () => Promise<void>;
  todayDistanceKm: number;
  tripHistory: TripRecord[];
  tripId: string | null;
  tripStatus: TripStatus;
  user: EmployeeUser | null;
  weeklyCompliance: string;
};

export const FieldOpsContext = createContext<FieldOpsContextValue | null>(null);

type FieldOpsProviderProps = { children: ReactNode };

export function FieldOpsProvider({ children }: FieldOpsProviderProps) {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [claims, setClaims] = useState<EmployeeClaim[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [tripStatus, setTripStatus] = useState<TripStatus>("idle");
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripStartTime, setTripStartTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [path, setPath] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [tripHistory, setTripHistory] = useState<TripRecord[]>([]);
  const [weeklyComplianceVal, setWeeklyComplianceVal] = useState("0%");
  const [todayDistanceFromServer, setTodayDistanceFromServer] = useState(0);

  const [network, setNetwork] = useState<NetworkState>({ isOnline: true, isSyncing: false, lastSyncedAt: null });
  const [alerts, setAlerts] = useState<FieldAlerts>({ outsideGeofence: false, offline: false, gpsDisabled: false, lowBattery: false });

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationBatchRef = useRef<LocationPointPayload[]>([]);
  const isUsingBackend = useRef(false);

  const clearTrackingIntervals = useCallback(() => {
    if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resetTripDraft = useCallback(() => {
    clearTrackingIntervals();
    setTripId(null);
    setTripStartTime(null);
    setElapsedSeconds(0);
    setDistanceKm(0);
    setPath([]);
    setCurrentLocation(null);
    setTripStatus("idle");
    locationBatchRef.current = [];
  }, [clearTrackingIntervals]);

  // ─── Fetch claims from backend ──────────────────────────────────────────────
  const fetchClaims = useCallback(async () => {
    try {
      const serverClaims = await api.claims.list();
      const mapped: EmployeeClaim[] = serverClaims.map((c) => ({
        id: c.id,
        category: c.category,
        amountInr: Number(c.amount_inr),
        status: c.status === "approved" ? "Approved" : c.status === "rejected" ? "Submitted" : "Pending",
        tripId: c.trip_id ?? undefined,
        createdAt: c.created_at,
      }));
      setClaims(mapped);
    } catch { /* keep existing claims */ }
  }, []);

  // ─── Fetch dashboard stats ──────────────────────────────────────────────────
  const fetchDashboardStats = useCallback(async () => {
    try {
      const stats = await api.dashboard.getEmployee();
      if (stats) {
        setWeeklyComplianceVal(stats.weeklyCompliance);
        setTodayDistanceFromServer(stats.todayDistanceKm);
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Battery / Network polling ──────────────────────────────────────────────
  const evaluateBattery = useCallback(async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      setAlerts((prev) => ({ ...prev, lowBattery: level <= 0.2 }));
    } catch { setAlerts((prev) => ({ ...prev, lowBattery: false })); }
  }, []);

  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const isOnline = !!state.isConnected && !!state.isInternetReachable;
      setNetwork((prev) => {
        const cameOnline = !prev.isOnline && isOnline;
        return cameOnline ? { ...prev, isOnline, isSyncing: true } : { ...prev, isOnline };
      });
      setAlerts((prev) => ({ ...prev, offline: !isOnline }));
    } catch {
      setNetwork((prev) => ({ ...prev, isOnline: false }));
      setAlerts((prev) => ({ ...prev, offline: true }));
    }
  }, []);

  useEffect(() => { const id = setInterval(() => { void checkNetwork(); }, NETWORK_POLL_MS); void checkNetwork(); return () => clearInterval(id); }, [checkNetwork]);
  useEffect(() => { if (!network.isSyncing) return; const t = setTimeout(() => { setNetwork((prev) => ({ ...prev, isSyncing: false, lastSyncedAt: new Date().toISOString() })); }, 2500); return () => clearTimeout(t); }, [network.isSyncing]);
  useEffect(() => { const id = setInterval(() => { void evaluateBattery(); }, BATTERY_POLL_MS); void evaluateBattery(); return () => clearInterval(id); }, [evaluateBattery]);

  // ─── Location Tracking ──────────────────────────────────────────────────────
  const applyLocationPoint = useCallback(
    (point: LocationPoint) => {
      setAlerts((prev) => ({ ...prev, gpsDisabled: false }));
      setCurrentLocation(point);

      if (user) {
        const center = user.geofenceCenter;
        if (center.latitude !== 0 || center.longitude !== 0) {
          const outside = isOutsideGeofence(point, center, user.geofenceRadiusMeters);
          setAlerts((prev) => ({ ...prev, outsideGeofence: outside }));
        } else {
          setAlerts((prev) => ({ ...prev, outsideGeofence: false }));
        }
      }

      if (tripStatus !== "active") return;

      // Send to socket
      if (tripId) {
        emitLocationUpdate({
          trip_id: tripId,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy,
          speed: null,
          altitude: null,
          recorded_at: new Date(point.timestamp).toISOString(),
        });

        // Buffer for REST batch upload
        locationBatchRef.current.push({
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy,
          speed: null,
          altitude: null,
          recorded_at: new Date(point.timestamp).toISOString(),
        });

        // Flush batch when enough points accumulated
        if (locationBatchRef.current.length >= LOCATION_BATCH_SIZE && isUsingBackend.current) {
          const batch = [...locationBatchRef.current];
          locationBatchRef.current = [];
          void api.locations.uploadBatch(tripId, batch);
        }
      }

      setPath((previousPath) => {
        if (previousPath.length === 0) return [point];
        const previousPoint = previousPath[previousPath.length - 1];
        if (shouldIgnoreLocationPoint(previousPoint, point)) return previousPath;
        const segmentMeters = haversineDistanceMeters(previousPoint, point);
        setDistanceKm((prev) => prev + segmentMeters / 1000);
        return [...previousPath, point];
      });
    },
    [tripStatus, user, tripId]
  );

  const pollLocation = useCallback(async () => {
    if (tripStatus !== "active") return;
    const point = await fetchCurrentLocation();
    if (!point) { setAlerts((prev) => ({ ...prev, gpsDisabled: true })); return; }
    applyLocationPoint(point);
  }, [applyLocationPoint, tripStatus]);

  const refreshCurrentLocation = useCallback(async () => {
    const hasPermission = await ensureLocationPermission();
    if (!hasPermission) { setAlerts((prev) => ({ ...prev, gpsDisabled: true })); return null; }
    const point = await fetchCurrentLocation();
    if (!point) { setAlerts((prev) => ({ ...prev, gpsDisabled: true })); return null; }
    applyLocationPoint(point);
    return point;
  }, [applyLocationPoint]);

  useEffect(() => {
    if (tripStatus !== "active") {
      if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
      return;
    }
    void pollLocation();
    locationIntervalRef.current = setInterval(() => { void pollLocation(); }, LOCATION_POLL_MS);
    return () => { if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; } };
  }, [tripStatus, pollLocation]);

  useEffect(() => {
    if (tripStatus !== "active") {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => { setElapsedSeconds((prev) => prev + 1); }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [tripStatus]);

  // ─── Session Restoration ────────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (session && session.user) {
          const u = session.user;
          isUsingBackend.current = true;
          await storeAuthSession({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user: {
              id: u.id,
              email: u.email,
              name: (u.user_metadata as any)?.full_name ?? u.email?.split("@")[0] ?? "Employee",
              role: (u.user_metadata as any)?.role ?? "employee",
            },
          });
          setUser({
            employeeId: (u.user_metadata as any)?.employeeId ?? `EMP-${u.id.slice(0, 4).toUpperCase()}`,
            email: u.email ?? "",
            name: (u.user_metadata as any)?.full_name ?? u.email?.split("@")[0] ?? "Employee",
            title: (u.user_metadata as any)?.title ?? "Field Employee",
            region: (u.user_metadata as any)?.region ?? "Unknown",
            pendingActions: 0,
            weeklyCompliance: "0%",
            tasks: [],
            checkpoints: [],
            geofenceCenter: (u.user_metadata as any)?.geofenceCenter ?? { latitude: 0, longitude: 0 },
            geofenceRadiusMeters: (u.user_metadata as any)?.geofenceRadiusMeters ?? 25000
          });
          void connectSocket();
          void fetchClaims();
          void fetchDashboardStats();

          // Check for active trip
          const activeTrip = await api.trips.getActive();
          if (activeTrip) {
            setTripId(activeTrip.id);
            setTripStartTime(activeTrip.started_at);
            setTripStatus(activeTrip.status === "paused" ? "paused" : "active");
            setDistanceKm(Number(activeTrip.total_distance_km) || 0);
            const elapsed = Math.round((Date.now() - new Date(activeTrip.started_at).getTime()) / 1000);
            setElapsedSeconds(elapsed);
          }
        } else {
          const storedToken = await api.getStoredToken();
          if (storedToken) {
            const result = await api.getMe();
            if (result.success && result.user) {
              isUsingBackend.current = true;
              setUser({
                employeeId: `EMP-${(result.user.id ?? "").slice(0, 4).toUpperCase()}`,
                email: result.user.email ?? "",
                name: result.user.name ?? result.user.full_name ?? "Employee",
                title: result.user.title ?? "Field Employee",
                region: result.user.region ?? "Unknown",
                pendingActions: 0,
                weeklyCompliance: "0%",
                tasks: [],
                checkpoints: [],
                geofenceCenter: { latitude: 0, longitude: 0 },
                geofenceRadiusMeters: 25000
              });
              void connectSocket();
              void fetchClaims();
              void fetchDashboardStats();
            } else { await api.logout(); }
          }
        }
      } catch (error) {
        console.error("Session restoration error:", error);
      } finally { setIsInitializing(false); }
    };
    void restoreSession();
  }, [fetchClaims, fetchDashboardStats]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          await storeAuthSession({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: (session.user.user_metadata as any)?.full_name ?? session.user.email?.split("@")[0] ?? "Employee",
            },
          });
        } else {
          await clearAuthSession();
        }
      } catch (error) {
        console.error("Auth state sync error:", error);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => () => { clearTrackingIntervals(); }, [clearTrackingIntervals]);

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });

      if (!sbError && sbData?.session && sbData.session.user) {
        const u = sbData.session.user;
        isUsingBackend.current = true;
        await storeAuthSession({
          accessToken: sbData.session.access_token,
          refreshToken: sbData.session.refresh_token,
          user: {
            id: u.id,
            email: u.email,
            name: (u.user_metadata as any)?.full_name ?? u.email?.split("@")[0] ?? email.split("@")[0],
          },
        });
        setUser({
          employeeId: (u.user_metadata as any)?.employeeId ?? `EMP-${u.id.slice(0, 4).toUpperCase()}`,
          email: u.email ?? email,
          name: (u.user_metadata as any)?.full_name ?? u.email?.split("@")[0] ?? email.split("@")[0],
          title: (u.user_metadata as any)?.title ?? "Field Employee",
          region: (u.user_metadata as any)?.region ?? "Unknown",
          pendingActions: 0, weeklyCompliance: "0%", tasks: [], checkpoints: [],
          geofenceCenter: (u.user_metadata as any)?.geofenceCenter ?? { latitude: 0, longitude: 0 },
          geofenceRadiusMeters: (u.user_metadata as any)?.geofenceRadiusMeters ?? 25000
        });
        resetTripDraft();
        void connectSocket();
        void fetchClaims();
        void fetchDashboardStats();
        return null;
      }
      return sbError?.message ?? "Invalid email or password.";
    } catch (error) {
      console.error("Login error:", error);
      return "Login failed. Please try again.";
    }
  }, [resetTripDraft, fetchClaims, fetchDashboardStats]);

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await api.logout();
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    disconnectSocket();
    setUser(null); setClaims([]); setTripHistory([]);
    resetTripDraft();
    isUsingBackend.current = false;
    await clearAuthSession();
  }, [resetTripDraft]);

  // ─── Trip Actions (wired to backend) ────────────────────────────────────────
  const startTrip = useCallback(async () => {
    if (!user) return;
    const hasPermission = await ensureLocationPermission();
    if (!hasPermission) { setAlerts((prev) => ({ ...prev, gpsDisabled: true })); return; }

    const initialLoc = await fetchCurrentLocation();

    if (isUsingBackend.current) {
      try {
        const trip = await api.trips.start(initialLoc?.latitude, initialLoc?.longitude);
        setTripId(trip.id);
        setTripStartTime(trip.started_at);
        emitTripStarted(trip.id);
      } catch (err) {
        console.error("Failed to start trip via API:", err);
        setTripId(`TRP-${Date.now()}`);
        setTripStartTime(new Date().toISOString());
      }
    } else {
      setTripId(`TRP-${Date.now()}`);
      setTripStartTime(new Date().toISOString());
    }

    setElapsedSeconds(0); setDistanceKm(0); setPath([]); setCurrentLocation(null);
    setTripStatus("active");
  }, [user]);

  const pauseTrip = useCallback(async () => {
    if (tripStatus !== "active" || !tripId) return;
    if (isUsingBackend.current) {
      try { await api.trips.pause(tripId); } catch (err) { console.error("Pause API error:", err); }
    }
    // Flush remaining location batch
    if (locationBatchRef.current.length > 0 && isUsingBackend.current) {
      const batch = [...locationBatchRef.current]; locationBatchRef.current = [];
      void api.locations.uploadBatch(tripId, batch);
    }
    setTripStatus("paused");
  }, [tripStatus, tripId]);

  const resumeTrip = useCallback(async () => {
    if (tripStatus !== "paused" || !tripId) return;
    if (isUsingBackend.current) {
      try { await api.trips.resume(tripId); } catch (err) { console.error("Resume API error:", err); }
    }
    setTripStatus("active");
  }, [tripStatus, tripId]);

  const endTrip = useCallback(async () => {
    if (!tripId || !tripStartTime || (tripStatus !== "active" && tripStatus !== "paused")) return;

    // Flush remaining location batch
    if (locationBatchRef.current.length > 0 && isUsingBackend.current) {
      const batch = [...locationBatchRef.current]; locationBatchRef.current = [];
      await api.locations.uploadBatch(tripId, batch);
    }

    if (isUsingBackend.current) {
      try {
        const result = await api.trips.end(tripId);
        const serverDistance = result.distance.totalKm;
        setDistanceKm(serverDistance);
        emitTripEnded(tripId, serverDistance);

        // Refresh claims from server
        void fetchClaims();
        void fetchDashboardStats();

        const record: TripRecord = {
          tripId, startTime: tripStartTime, endTime: result.trip.ended_at ?? new Date().toISOString(),
          durationSeconds: result.distance.durationSeconds, distanceKm: serverDistance, path
        };
        setTripHistory((prev) => [record, ...prev]);
        setTripStatus("completed");
        return;
      } catch (err) {
        console.error("End trip API error:", err);
      }
    }

    // Fallback: client-side calculation
    const finishedAt = new Date().toISOString();
    const record: TripRecord = {
      tripId, startTime: tripStartTime, endTime: finishedAt,
      durationSeconds: elapsedSeconds, distanceKm, path
    };
    setTripHistory((prev) => [record, ...prev]);

    const reimbursement = Number((distanceKm * 10).toFixed(2));
    if (reimbursement > 0) {
      const claim: EmployeeClaim = {
        id: `CLM-${Date.now().toString().slice(-6)}`, category: "Trip Reimbursement",
        amountInr: reimbursement, status: "Pending", tripId, createdAt: finishedAt
      };
      setClaims((prev) => [claim, ...prev]);
    }
    setTripStatus("completed");
  }, [distanceKm, elapsedSeconds, path, tripId, tripStartTime, tripStatus, fetchClaims, fetchDashboardStats]);

  // ─── Computed Values ────────────────────────────────────────────────────────
  const pendingClaimAmountInr = useMemo(
    () => claims.filter((c) => c.status !== "Approved").reduce((t, c) => t + c.amountInr, 0),
    [claims]
  );

  const todayDistanceKm = useMemo(() => {
    if (isUsingBackend.current && todayDistanceFromServer > 0) {
      const activeDistance = tripStatus === "active" || tripStatus === "paused" ? distanceKm : 0;
      return Number((todayDistanceFromServer + activeDistance).toFixed(2));
    }
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = tripHistory.filter((t) => t.endTime.startsWith(today)).reduce((s, t) => s + t.distanceKm, 0);
    const activeDistance = tripStatus === "active" || tripStatus === "paused" ? distanceKm : 0;
    return Number((completedToday + activeDistance).toFixed(2));
  }, [distanceKm, tripHistory, tripStatus, todayDistanceFromServer]);

  const primaryActionLabel: FieldOpsContextValue["primaryActionLabel"] =
    tripStatus === "active" ? "Pause Trip" : tripStatus === "paused" ? "Resume Trip" : "Start Trip";

  const value = useMemo<FieldOpsContextValue>(
    () => ({
      alerts, claims, currentLocation, elapsedSeconds, endTrip,
      gpsPointsCount: path.length, isAuthenticated: !!user, isInitializing,
      login, logout, network, path, pauseTrip, pendingClaimAmountInr,
      primaryActionLabel, refreshCurrentLocation, resumeTrip, startTrip,
      todayDistanceKm, tripHistory, tripId, tripStatus, user,
      weeklyCompliance: isUsingBackend.current ? weeklyComplianceVal : (user?.weeklyCompliance ?? "0%")
    }),
    [
      alerts, claims, currentLocation, elapsedSeconds, endTrip, isInitializing,
      login, network, path, pauseTrip, pendingClaimAmountInr, primaryActionLabel,
      refreshCurrentLocation, resumeTrip, startTrip, todayDistanceKm, tripHistory,
      tripId, tripStatus, user, logout, weeklyComplianceVal
    ]
  );

  return <FieldOpsContext.Provider value={value}>{children}</FieldOpsContext.Provider>;
}
