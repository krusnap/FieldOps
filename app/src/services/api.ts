// Consolidated API client and helpers for the mobile app.
// The file provides an Axios instance with token handling and
// helper methods used by the app for auth/profile operations.
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.5:4000";

export const AUTH_STORAGE_KEYS = {
  accessToken: "fieldops_token",
  refreshToken: "fieldops_refresh_token",
  user: "fieldops_user",
} as const;

export async function storeAuthSession(session: {
  accessToken: string;
  refreshToken: string;
  user?: unknown;
}): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.accessToken, session.accessToken);
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);

  if (typeof session.user !== "undefined") {
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
  }
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    AUTH_STORAGE_KEYS.accessToken,
    AUTH_STORAGE_KEYS.refreshToken,
    AUTH_STORAGE_KEYS.user,
  ]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    employeeId?: string;
    name: string;
    title?: string;
    region?: string;
    role: string;
    full_name: string;
    rate_per_km: number | null;
    pendingActions?: number;
    weeklyCompliance?: string;
    tasks?: Array<{ time: string; title: string; place: string }>;
    checkpoints?: Array<{ label: string; eta: string }>;
    initialClaims?: Array<{
      id: string;
      category: string;
      amountInr: number;
      status: string;
      createdAt: string;
    }>;
    geofenceCenter?: { latitude: number; longitude: number };
    geofenceRadiusMeters?: number;
  };
  error?: string;
}

export interface TripData {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number;
  total_duration_seconds: number;
  pause_duration_seconds: number;
  paused_at: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  avg_speed_kmh: number;
}

export interface ClaimData {
  id: string;
  trip_id: string | null;
  user_id: string;
  amount_inr: number;
  rate_per_km: number;
  distance_km: number;
  status: string;
  category: string;
  notes: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface LocationPointPayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  altitude?: number | null;
  recorded_at: string;
}

export interface EmployeeDashboardData {
  todayDistanceKm: number;
  activeTrip: TripData | null;
  pendingClaimAmountInr: number;
  weeklyCompliance: string;
  todayTrips: number;
  totalClaims: number;
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach the access token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 → try refreshing the token once
let isRefreshing = false;

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        if (data.success && data.data) {
          await AsyncStorage.setItem(AUTH_STORAGE_KEYS.accessToken, data.data.access_token);
          await AsyncStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.data.refresh_token);

          originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
          isRefreshing = false;
          return axiosInstance(originalRequest);
        }
      } catch {
        // Refresh failed — clear session, user needs to re-login
        await clearAuthSession();
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

const api = {
  /**
   * Authenticate with the backend using email + password.
   * Stores tokens in AsyncStorage on success.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // First, try the backend API
      const { data } = await axiosInstance.post("/auth/login", { email, password });

      if (data.success && data.data) {
        const { access_token, refresh_token, user } = data.data;

        await storeAuthSession({
          accessToken: access_token,
          refreshToken: refresh_token,
          user,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.full_name ?? user.email.split("@")[0],
            full_name: user.full_name ?? user.email.split("@")[0],
            role: user.role,
            rate_per_km: user.rate_per_km ?? null,
          },
        };
      }

      return { success: false, error: data.error ?? "Login failed" };
    } catch (error: any) {
      const message =
        error.response?.data?.error ?? error.message ?? "Network error. Check your connection.";
      return { success: false, error: message };
    }
  },

  /**
   * Get the current user profile from the backend.
   */
  async getMe(): Promise<LoginResult> {
    try {
      const { data } = await axiosInstance.get("/auth/me");

      if (data.success && data.data) {
        return {
          success: true,
          user: {
            id: data.data.id,
            email: data.data.email,
            name: data.data.full_name,
            full_name: data.data.full_name,
            role: data.data.role,
            rate_per_km: data.data.rate_per_km,
          },
        };
      }

      return { success: false, error: "Failed to fetch profile" };
    } catch {
      return { success: false, error: "Network error" };
    }
  },

  /**
   * Log out — clears local tokens and calls backend.
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Ignore server errors — we clear local state regardless
    } finally {
      await clearAuthSession();
    }
  },

  /**
   * Check if a stored session exists.
   */
  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  },

  /**
   * Get stored user profile.
   */
  async getStoredUser(): Promise<LoginResult["user"] | null> {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  },

  // ─── Trip Lifecycle ──────────────────────────────────────────────────────────

  trips: {
    async start(latitude?: number, longitude?: number): Promise<TripData> {
      const { data } = await axiosInstance.post("/api/trips/start", {
        latitude,
        longitude,
      });
      if (!data.success) throw new Error(data.error ?? "Failed to start trip");
      return data.data;
    },

    async pause(tripId: string): Promise<TripData> {
      const { data } = await axiosInstance.patch(`/api/trips/${tripId}/pause`);
      if (!data.success) throw new Error(data.error ?? "Failed to pause trip");
      return data.data;
    },

    async resume(tripId: string): Promise<TripData> {
      const { data } = await axiosInstance.patch(`/api/trips/${tripId}/resume`);
      if (!data.success) throw new Error(data.error ?? "Failed to resume trip");
      return data.data;
    },

    async end(tripId: string): Promise<{ trip: TripData; distance: { totalKm: number; avgSpeedKmh: number; durationSeconds: number }; claim: ClaimData | null }> {
      const { data } = await axiosInstance.post(`/api/trips/${tripId}/end`);
      if (!data.success) throw new Error(data.error ?? "Failed to end trip");
      return data.data;
    },

    async getActive(): Promise<TripData | null> {
      try {
        const { data } = await axiosInstance.get("/api/trips/active");
        return data.success ? data.data : null;
      } catch {
        return null;
      }
    },

    async getHistory(page = 1, limit = 20): Promise<{ trips: TripData[]; total: number }> {
      const { data } = await axiosInstance.get(`/api/trips/history?page=${page}&limit=${limit}`);
      return { trips: data.data ?? [], total: data.pagination?.total ?? 0 };
    },

    async getById(tripId: string): Promise<TripData & { locations: LocationPointPayload[] }> {
      const { data } = await axiosInstance.get(`/api/trips/${tripId}`);
      if (!data.success) throw new Error(data.error ?? "Trip not found");
      return data.data;
    },
  },

  // ─── Location Batch Upload ─────────────────────────────────────────────────

  locations: {
    async uploadBatch(tripId: string, points: LocationPointPayload[]): Promise<number> {
      try {
        const { data } = await axiosInstance.post("/api/locations/batch", {
          trip_id: tripId,
          points,
        });
        return data.data?.inserted ?? 0;
      } catch {
        return 0;
      }
    },
  },

  // ─── Claims ──────────────────────────────────────────────────────────────────

  claims: {
    async list(status?: string): Promise<ClaimData[]> {
      try {
        const params = status ? `?status=${status}` : "";
        const { data } = await axiosInstance.get(`/api/claims${params}`);
        return data.data ?? [];
      } catch {
        return [];
      }
    },

    async create(payload: { trip_id?: string; amount_inr: number; category: string; notes?: string }): Promise<ClaimData | null> {
      try {
        const { data } = await axiosInstance.post("/api/claims", payload);
        return data.success ? data.data : null;
      } catch {
        return null;
      }
    },
  },

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  dashboard: {
    async getEmployee(): Promise<EmployeeDashboardData | null> {
      try {
        const { data } = await axiosInstance.get("/api/dashboard/employee");
        return data.success ? data.data : null;
      } catch {
        return null;
      }
    },
  },
};

export default api;
