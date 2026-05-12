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

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const { data } = await client.get("/health");
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

  async overrideClaim(id: string, payload: { distance_km?: number; notes?: string; category?: string }) {
    const { data } = await client.patch(`/api/claims/${id}/override`, payload);
    return data.data;
  },

  // ─── Admin Dashboard ───────────────────────────────────────────────────────
  async getAdminDashboard() {
    const { data } = await client.get("/api/dashboard/admin");
    return data.data;
  },

  // ─── Accountant Dashboard ──────────────────────────────────────────────────
  async getAccountantDashboard() {
    const { data } = await client.get("/api/dashboard/accountant");
    return data.data;
  },

  // ─── Admin User Management ─────────────────────────────────────────────────
  async getAllUsers() {
    const { data } = await client.get("/api/employees/all");
    return data.data ?? [];
  },

  async createUser(payload: {
    full_name: string;
    email: string;
    password: string;
    role: "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNTANT";
    rate_per_km?: number;
  }) {
    const { data } = await client.post("/api/employees/create", payload);
    return data.data;
  },

  async updateUser(id: string, payload: {
    full_name?: string;
    role?: "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNTANT";
    rate_per_km?: number;
    is_active?: boolean;
  }) {
    const { data } = await client.patch(`/api/employees/${id}`, payload);
    return data.data;
  },

  async deactivateUser(id: string) {
    const { data } = await client.delete(`/api/employees/${id}/deactivate`);
    return data;
  },

  // ─── Admin Assignments ────────────────────────────────────────────────────
  async getAssignments() {
    const { data } = await client.get("/api/employees/assignments");
    return data.data ?? [];
  },

  async createAssignment(employee_id: string, manager_id: string) {
    const { data } = await client.post("/api/employees/assignments", { employee_id, manager_id });
    return data.data;
  },

  async removeAssignment(id: string) {
    const { data } = await client.delete(`/api/employees/assignments/${id}`);
    return data;
  },
};

export default apiClient;

