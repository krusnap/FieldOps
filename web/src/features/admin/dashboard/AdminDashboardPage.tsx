import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import apiClient from "../../../lib/apiClient";

// This page used to render static mocks. It now fetches live data from the API.

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState({ totalUsers: 0, activeEmployees: 0, totalTrips: 0, claimsProcessed: 0 });
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [travelTrend, setTravelTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        // Manager/admin summary
        const managerData = await apiClient.getManagerDashboard();

        // Recent claims and users
        const claimsData = await apiClient.getClaims();
        const usersData = await apiClient.getEmployees();

        if (!mounted) return;

        setOverview({
          totalUsers: usersData.length,
          activeEmployees: usersData.filter((u: any) => u.is_active).length,
          totalTrips: managerData?.weeklyTravelSummaryKm ? Math.round(managerData.weeklyTravelSummaryKm) : 0,
          claimsProcessed: managerData?.approvedClaims ?? 0,
        });

        setClaimsList(claimsData ?? []);
        setUsersList(usersData ?? []);

        // Simple travel trend placeholder: show last 7 days value based on weekly summary
        setTravelTrend([{ label: "Last 7d", value: managerData?.weeklyTravelSummaryKm ?? 0 }]);
      } catch (err) {
        // keep UI resilient; errors will be logged in console
        // eslint-disable-next-line no-console
        console.error("Failed to load admin dashboard data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const approved = claimsList.filter((item) => item.status === "approved").length;
  const rejected = claimsList.filter((item) => item.status === "rejected").length;
  const pending = claimsList.filter((item) => item.status === "pending").length;

  const inactiveUsers = usersList.filter((item) => item.status === "Inactive" || !item.is_active).length;
  const recentClaims = [...claimsList]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 4);

  return (
    <div className="stack-24">
      {isLoading ? <p>Loading admin dashboard...</p> : null}

      <section className="stats-grid">
        <Card title="Total Users">
          <p className="kpi">{overview.totalUsers}</p>
        </Card>
        <Card title="Active Employees">
          <p className="kpi">{overview.activeEmployees}</p>
        </Card>
        <Card title="Total Trips">
          <p className="kpi">{overview.totalTrips}</p>
        </Card>
        <Card title="Claims Processed">
          <p className="kpi success">{overview.claimsProcessed}</p>
        </Card>
      </section>

      <section className="admin-grid">
        <Card title="Admin Command Center" subtitle="Jump to critical controls">
          <div className="admin-quick-actions">
            <Link to="/admin/users">
              <Button className="full-width">Manage Users</Button>
            </Link>
            <Link to="/admin/permissions">
              <Button variant="ghost" className="full-width">
                Configure Permissions
              </Button>
            </Link>
            <Link to="/admin/manager-control">
              <Button variant="ghost" className="full-width">
                Manage Reporting Hierarchy
              </Button>
            </Link>
            <Link to="/admin/system">
              <Button variant="ghost" className="full-width">
                Open System Monitoring
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Claim Health Snapshot" subtitle="Current approval status mix">
          <DonutStatusChart approved={approved} rejected={rejected} pending={pending} />
        </Card>

        <Card title="Trip Throughput" subtitle="Weekly trend of travel load">
          <LineTrendChart data={travelTrend} />
        </Card>

        <Card title="Risk Queue" subtitle="Items that need admin attention now">
          <div className="list-stack">
            <article className="list-item">
              <div>
                <strong>Pending Claims</strong>
                <p>{pending} claims waiting for manager action</p>
              </div>
              <Badge status="pending" />
            </article>
            <article className="list-item">
              <div>
                <strong>Rejected Claims</strong>
                <p>{rejected} claims require review workflow checks</p>
              </div>
              <Badge status="rejected" />
            </article>
            <article className="list-item">
              <div>
                <strong>Inactive Users</strong>
                <p>{inactiveUsers} accounts are currently inactive</p>
              </div>
              <span className="badge badge-offline">inactive</span>
            </article>
          </div>
        </Card>
      </section>

      <section className="content-grid-2">
        <Card title="Recent Claims Activity" subtitle="Most recent submissions">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map((claim) => (
                <tr key={claim.id}>
                  <td>{claim.employeeName || claim.employee_email || claim.user_email}</td>
                  <td>{claim.date}</td>
                  <td>${(claim.amount ?? claim.amount_inr ?? 0).toFixed(2)}</td>
                  <td>
                    <Badge status={claim.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Control Checklist" subtitle="Recommended admin runbook">
          <div className="checklist">
            <p>
              <span>1</span> Verify role permissions for managers and accountants.
            </p>
            <p>
              <span>2</span> Review rejection spikes in claims analytics.
            </p>
            <p>
              <span>3</span> Reconcile inactive users with HR records.
            </p>
            <p>
              <span>4</span> Confirm queue backlog and latency are within target thresholds.
            </p>
          </div>
          <div className="top-space">
            <Link to="/admin/analytics" className="link-inline">
              Open Full Analytics
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
