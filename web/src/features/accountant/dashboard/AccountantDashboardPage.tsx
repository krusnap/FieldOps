import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import BarDistanceChart from "../../../components/charts/BarDistanceChart";
import { Link } from "react-router-dom";
import apiClient from "../../../lib/apiClient";

interface AccountantStats {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalApprovedAmountInr: number;
  totalPendingAmountInr: number;
  totalRejectedAmountInr: number;
  approvedDistanceKm: number;
  pendingDistanceKm: number;
  rejectedDistanceKm: number;
  recentApproved: BundleRow[];
  recentAll: BundleRow[];
}

interface BundleRow {
  id: string;
  employeeName: string;
  date: string;
  amountInr: number;
  distanceKm: number;
  tripCount: number;
  status: string;
}

export default function AccountantDashboardPage() {
  const [stats, setStats] = useState<AccountantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAccountantDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading accountant dashboard...</p>;
  if (!stats) return <p style={{ padding: 24, color: "red" }}>Failed to load dashboard.</p>;

  const distanceData = [
    { label: "Approved KM", value: stats.approvedDistanceKm },
    { label: "Pending KM", value: stats.pendingDistanceKm },
    { label: "Rejected KM", value: stats.rejectedDistanceKm },
  ];

  return (
    <div className="stack-24">
      {/* KPI Row */}
      <section className="stats-grid">
        <Card title="Total Approved">
          <p className="kpi success">{stats.approvedCount}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ₹{stats.totalApprovedAmountInr.toFixed(2)} reimbursed
          </p>
        </Card>
        <Card title="Pending Approval">
          <p className="kpi warning">{stats.pendingCount}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ₹{stats.totalPendingAmountInr.toFixed(2)} awaiting
          </p>
        </Card>
        <Card title="Rejected">
          <p className="kpi">{stats.rejectedCount}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ₹{stats.totalRejectedAmountInr.toFixed(2)} excluded
          </p>
        </Card>
        <Card title="Approved Reimbursement">
          <p className="kpi success">₹{stats.totalApprovedAmountInr.toFixed(2)}</p>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {stats.approvedDistanceKm.toFixed(1)} km covered
          </p>
        </Card>
      </section>

      <section className="content-grid-2">
        <Card title="Claims Status Mix" subtitle="Approved vs rejected vs pending">
          <DonutStatusChart
            approved={stats.approvedCount}
            rejected={stats.rejectedCount}
            pending={stats.pendingCount}
          />
        </Card>

        <Card title="Distance Snapshot" subtitle="km covered by reimbursement outcome">
          <BarDistanceChart data={distanceData} />
        </Card>
      </section>

      <section className="content-grid-2">
        {/* Recent approved bundles table */}
        <Card title="Latest Claim Bundles" subtitle="Most recent reimbursement entries">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Trips</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAll.length === 0 ? (
                <tr><td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center" }}>No records yet</td></tr>
              ) : stats.recentAll.map((b) => (
                <tr key={b.id}>
                  <td>{b.employeeName}</td>
                  <td>{b.date}</td>
                  <td>{b.tripCount}</td>
                  <td>₹{b.amountInr.toFixed(2)}</td>
                  <td><Badge status={b.status as any} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Summary panel */}
        <Card title="Reimbursement Summary" subtitle="Financial breakdown for this period">
          <div className="list-stack">
            <article className="list-item">
              <div>
                <strong>Approved Amount</strong>
                <p>₹{stats.totalApprovedAmountInr.toFixed(2)} ready for reimbursement cycle</p>
              </div>
              <Badge status="approved" />
            </article>
            <article className="list-item">
              <div>
                <strong>Pending Amount</strong>
                <p>₹{stats.totalPendingAmountInr.toFixed(2)} awaiting manager decision</p>
              </div>
              <Badge status="pending" />
            </article>
            <article className="list-item">
              <div>
                <strong>Rejected Amount</strong>
                <p>₹{stats.totalRejectedAmountInr.toFixed(2)} excluded from reimbursement</p>
              </div>
              <Badge status="rejected" />
            </article>
          </div>
          <div className="top-space">
            <Link to="/accountant/claims">
              <Button className="full-width">Open Full Claims Table</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
