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

  // ─── Bundles (Daily Claim Bundles) ────────────────────────────────
  async getManagerBundles(params?: { status?: string; date_from?: string; date_to?: string }) {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.date_from) q.set("date_from", params.date_from);
    if (params?.date_to) q.set("date_to", params.date_to);
    const { data } = await client.get(`/api/bundles/manager?${q.toString()}`);
    return data.data ?? [];
  },

  async getBundle(id: string) {
    const { data } = await client.get(`/api/bundles/${id}`);
    return data.data;
  },

  async approveBundle(id: string) {
    const { data } = await client.patch(`/api/bundles/${id}/approve`);
    return data.data;
  },

  async rejectBundle(id: string, reason: string) {
    const { data } = await client.patch(`/api/bundles/${id}/reject`, { reason });
    return data.data;
  },

  async createManagerClaim(payload: {
    user_id: string;
    amount_inr: number;
    distance_km?: number;
    category: string;
    notes?: string;
    status?: "pending" | "approved";
  }) {
    const { data } = await client.post("/api/claims/manager/create", payload);
    return data.data;
  },

  async overrideClaim(id: string, payload: { amount_inr?: number; notes?: string; category?: string }) {
    const { data } = await client.patch(`/api/claims/${id}/override`, payload);
    return data.data;
  },
};

export default apiClient;

