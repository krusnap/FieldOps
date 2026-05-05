import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { supabase } from "./supabase";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL as string | undefined ?? "http://localhost:4000";

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT to every request
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  // ─── Auth ─────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const { data } = await client.post("/auth/login", { email, password });
    return data;
  },

  async getMe() {
    const { data } = await client.get("/auth/me");
    return data;
  },

  // ─── Dashboard ────────────────────────────────────────────────────
  async getManagerDashboard() {
    const { data } = await client.get("/api/dashboard/manager");
    return data.data;
  },

  // ─── Employees ────────────────────────────────────────────────────
  async getEmployees() {
    const { data } = await client.get("/api/employees");
    return data.data ?? [];
  },

  async getEmployee(id: string) {
    const { data } = await client.get(`/api/employees/${id}`);
    return data.data;
  },

  async getEmployeeStats(id: string) {
    const { data } = await client.get(`/api/employees/${id}/stats`);
    return data.data;
  },

  // ─── Claims ───────────────────────────────────────────────────────
  async getClaims(status?: string) {
    const params = status && status !== "all" ? `?status=${status}` : "";
    const { data } = await client.get(`/api/claims${params}`);
    return data.data ?? [];
  },

  async getClaim(id: string) {
    const { data } = await client.get(`/api/claims/${id}`);
    return data.data;
  },

  async approveClaim(id: string) {
    const { data } = await client.patch(`/api/claims/${id}/approve`);
    return data.data;
  },

  async rejectClaim(id: string, reason: string) {
    const { data } = await client.patch(`/api/claims/${id}/reject`, { reason });
    return data.data;
  },

  // ─── Trips ────────────────────────────────────────────────────────
  async getEmployeeTrips(userId: string) {
    const { data } = await client.get(`/api/trips/employee/${userId}`);
    return data.data ?? [];
  },
};

export default apiClient;
