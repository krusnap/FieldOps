import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import apiClient from "../../../lib/apiClient";

interface AdminStats {
  totalUsers: number;
  totalEmployees: number;
  totalManagers: number;
  totalAccountants: number;
  inactiveUsers: number;
  totalTrips: number;
  todayTrips: number;
  pendingBundles: number;
  approvedBundles: number;
  rejectedBundles: number;
  totalApprovedAmountInr: number;
  totalPendingAmountInr: number;
  recentApproved: { employeeName: string; date: string; amountInr: number; distanceKm: number; status: string }[];
  travelTrendWeek: { label: string; date: string; value: number; trips: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAdminDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading admin dashboard...</p>;
  if (!stats) return <p style={{ padding: 24, color: "red" }}>Failed to load dashboard data.</p>;

  return (
    <div className="stack-24">
      {/* KPI Row */}
      <section className="stats-grid">
        <Card title="Total Users">
          <p className="kpi">{stats.totalUsers}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {stats.totalEmployees} employees · {stats.totalManagers} managers · {stats.totalAccountants} accountants
          </p>
        </Card>
        <Card title="Active Employees">
          <p className="kpi">{stats.totalEmployees}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {stats.inactiveUsers} inactive accounts
          </p>
        </Card>
        <Card title="Total Trips (All Time)">
          <p className="kpi">{stats.totalTrips}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {stats.todayTrips} today
          </p>
        </Card>
        <Card title="Approved Reimbursements">
          <p className="kpi success">₹{stats.totalApprovedAmountInr.toFixed(2)}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ₹{stats.totalPendingAmountInr.toFixed(2)} pending approval
          </p>
        </Card>
      </section>

      <section className="admin-grid">
        {/* Quick Actions */}
        <Card title="Admin Command Center" subtitle="Jump to critical controls">
          <div className="admin-quick-actions">
            <Link to="/admin/users">
              <button className="btn btn-primary full-width">Manage Users</button>
            </Link>
            <Link to="/admin/manager-control">
              <button className="btn btn-ghost full-width">Manage Reporting Hierarchy</button>
            </Link>
            <Link to="/admin/analytics">
              <button className="btn btn-ghost full-width">Open Analytics</button>
            </Link>
            <Link to="/admin/permissions">
              <button className="btn btn-ghost full-width">Configure Permissions</button>
            </Link>
          </div>
        </Card>

        {/* Claim Health Donut */}
        <Card title="Claim Bundle Health" subtitle="Current approval status mix">
          <DonutStatusChart
            approved={stats.approvedBundles}
            rejected={stats.rejectedBundles}
            pending={stats.pendingBundles}
          />
        </Card>

        {/* Travel Trend Line Chart */}
        <Card title="Trip Throughput" subtitle="Daily km covered — last 7 days">
          <LineTrendChart data={stats.travelTrendWeek} />
        </Card>

        {/* Risk Queue */}
        <Card title="Risk Queue" subtitle="Items needing admin attention">
          <div className="list-stack">
            <article className="list-item">
              <div>
                <strong>Pending Bundles</strong>
                <p>{stats.pendingBundles} bundles awaiting manager action</p>
              </div>
              <Badge status="pending" />
            </article>
            <article className="list-item">
              <div>
                <strong>Rejected Bundles</strong>
                <p>{stats.rejectedBundles} bundles rejected — may need override</p>
              </div>
              <Badge status="rejected" />
            </article>
            <article className="list-item">
              <div>
                <strong>Inactive Users</strong>
                <p>{stats.inactiveUsers} accounts currently inactive</p>
              </div>
              <span className="badge badge-offline">inactive</span>
            </article>
          </div>
        </Card>
      </section>

      {/* Recent Approved Claims */}
      <section className="content-grid-2">
        <Card title="Recent Approved Bundles" subtitle="Latest manager-approved claim bundles">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentApproved.length === 0 ? (
                <tr><td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center" }}>No approved bundles yet</td></tr>
              ) : stats.recentApproved.map((r, i) => (
                <tr key={i}>
                  <td>{r.employeeName}</td>
                  <td>{r.date}</td>
                  <td>₹{r.amountInr.toFixed(2)}</td>
                  <td>{r.distanceKm.toFixed(1)} km</td>
                  <td><Badge status={r.status as any} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="System Summary" subtitle="Platform health at a glance">
          <div className="checklist">
            <p><span>👥</span> {stats.totalUsers} total users across {stats.totalManagers + 1} manager groups</p>
            <p><span>📋</span> {stats.pendingBundles} claim bundles awaiting approval</p>
            <p><span>✅</span> {stats.approvedBundles} bundles approved all-time</p>
            <p><span>🚗</span> {stats.todayTrips} trips recorded today</p>
          </div>
          <div className="top-space">
            <Link to="/admin/users" className="link-inline">Manage All Users →</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
