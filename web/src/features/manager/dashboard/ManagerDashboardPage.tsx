import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { apiClient } from "../../../lib/apiClient";

interface ManagerOverview {
  totalEmployees: number;
  pendingClaims: number;
  approvedClaims: number;
  weeklyTravelSummaryKm: number;
}

interface EmployeeItem {
  id: string;
  name: string;
  city: string;
  weeklyDistanceKm: number;
  status: "traveling" | "idle" | "offline";
}

interface ClaimItem {
  id: string;
  user_id: string;
  amount_inr: number;
  distance_km: number;
  status: string;
  users?: { full_name: string };
}

export default function ManagerDashboardPage() {
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [pendingClaims, setPendingClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, emps, cls] = await Promise.all([
          apiClient.getManagerDashboard(),
          apiClient.getEmployees(),
          apiClient.getClaims("pending"),
        ]);
        setOverview(dash);
        setEmployees(emps);
        setPendingClaims(cls.slice(0, 3));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="stack-24"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="stack-24">
      <section className="stats-grid">
        <Card title="Total Employees">
          <p className="kpi">{overview?.totalEmployees ?? 0}</p>
        </Card>
        <Card title="Pending Claims">
          <p className="kpi warning">{overview?.pendingClaims ?? 0}</p>
        </Card>
        <Card title="Approved Claims">
          <p className="kpi success">{overview?.approvedClaims ?? 0}</p>
        </Card>
        <Card title="Weekly Travel Summary">
          <p className="kpi">{overview?.weeklyTravelSummaryKm ?? 0} km</p>
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
            {employees.length === 0 && <p>No employees assigned yet.</p>}
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
                  <strong>{(claim as any).users?.full_name ?? "Employee"}</strong>
                  <p>
                    {claim.distance_km} km · ₹{Number(claim.amount_inr).toFixed(2)}
                  </p>
                </div>
                <div className="row-center gap-12">
                  <Badge status={claim.status as any} />
                  <Link to={`/manager/claims/${claim.id}`}>
                    <Button variant="primary">Open</Button>
                  </Link>
                </div>
              </article>
            ))}
            {pendingClaims.length === 0 && <p>No pending claims.</p>}
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
