import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { claims, employees, managerOverview } from "../../../mocks/data";

export default function ManagerDashboardPage() {
  const pendingClaims = claims.filter((item) => item.status === "pending").slice(0, 3);

  return (
    <div className="stack-24">
      <section className="stats-grid">
        <Card title="Total Employees">
          <p className="kpi">{managerOverview.totalEmployees}</p>
        </Card>
        <Card title="Pending Claims">
          <p className="kpi warning">{managerOverview.pendingClaims}</p>
        </Card>
        <Card title="Approved Claims">
          <p className="kpi success">{managerOverview.approvedClaims}</p>
        </Card>
        <Card title="Weekly Travel Summary">
          <p className="kpi">{managerOverview.weeklyTravelSummaryKm} km</p>
        </Card>
      </section>

      <section className="content-grid-2">
        <Card title="Live Employee Monitoring" subtitle="Active team members and current status">
          <div className="list-stack">
            {employees.slice(0, 4).map((employee) => (
              <Link key={employee.id} className="list-item" to={`/manager/employees/${employee.id}`}>
                <div>
                  <strong>{employee.name}</strong>
                  <p>
                    {employee.city} · {employee.weeklyDistanceKm} km this week
                  </p>
                </div>
                <Badge status={employee.status} />
              </Link>
            ))}
          </div>
          <div className="top-space">
            <Link to="/manager/employees">
              <Button variant="ghost">View All Employees</Button>
            </Link>
          </div>
        </Card>

        <Card title="Claims Requiring Attention" subtitle="Review pending claims quickly">
          <div className="list-stack">
            {pendingClaims.map((claim) => (
              <article className="list-item" key={claim.id}>
                <div>
                  <strong>{claim.employeeName}</strong>
                  <p>
                    {claim.distanceKm} km · ${claim.amount.toFixed(2)}
                  </p>
                </div>
                <div className="row-center gap-12">
                  <Badge status={claim.status} />
                  <Link to={`/manager/claims/${claim.id}`}>
                    <Button variant="primary">Open</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="top-space">
            <Link to="/manager/claims">
              <Button variant="ghost">Go to Claims Review</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
