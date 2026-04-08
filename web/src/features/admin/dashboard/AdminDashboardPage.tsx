import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import { adminOverview, claims, travelTrend, users } from "../../../mocks/data";

export default function AdminDashboardPage() {
  const approved = claims.filter((item) => item.status === "approved").length;
  const rejected = claims.filter((item) => item.status === "rejected").length;
  const pending = claims.filter((item) => item.status === "pending").length;

  const inactiveUsers = users.filter((item) => item.status === "Inactive").length;
  const recentClaims = [...claims].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="stack-24">
      <section className="stats-grid">
        <Card title="Total Users">
          <p className="kpi">{adminOverview.totalUsers}</p>
        </Card>
        <Card title="Active Employees">
          <p className="kpi">{adminOverview.activeEmployees}</p>
        </Card>
        <Card title="Total Trips">
          <p className="kpi">{adminOverview.totalTrips}</p>
        </Card>
        <Card title="Claims Processed">
          <p className="kpi success">{adminOverview.claimsProcessed}</p>
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
                  <td>{claim.employeeName}</td>
                  <td>{claim.date}</td>
                  <td>${claim.amount.toFixed(2)}</td>
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
