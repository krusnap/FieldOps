import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import BarDistanceChart from "../../../components/charts/BarDistanceChart";
import { claims } from "../../../mocks/data";

export default function AccountantDashboardPage() {
  const approved = claims.filter((item) => item.status === "approved").length;
  const rejected = claims.filter((item) => item.status === "rejected").length;
  const pending = claims.filter((item) => item.status === "pending").length;

  const approvedAmount = claims
    .filter((item) => item.status === "approved")
    .reduce((total, item) => total + item.amount, 0);

  const rejectedAmount = claims
    .filter((item) => item.status === "rejected")
    .reduce((total, item) => total + item.amount, 0);

  const reimbursementDistance = [
    {
      label: "Approved KM",
      value: claims.filter((item) => item.status === "approved").reduce((sum, item) => sum + item.distanceKm, 0),
    },
    {
      label: "Rejected KM",
      value: claims.filter((item) => item.status === "rejected").reduce((sum, item) => sum + item.distanceKm, 0),
    },
    {
      label: "Pending KM",
      value: claims.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.distanceKm, 0),
    },
  ];

  const latestClaims = [...claims].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="stack-24">
      <section className="stats-grid">
        <Card title="Total Approved Claims">
          <p className="kpi success">{approved}</p>
        </Card>
        <Card title="Total Rejected Claims">
          <p className="kpi">{rejected}</p>
        </Card>
        <Card title="Pending Claims">
          <p className="kpi warning">{pending}</p>
        </Card>
        <Card title="Approved Reimbursement Value">
          <p className="kpi">${approvedAmount.toFixed(2)}</p>
        </Card>
      </section>

      <section className="content-grid-2">
        <Card title="Claims Status Mix" subtitle="Approved vs rejected vs pending">
          <DonutStatusChart approved={approved} rejected={rejected} pending={pending} />
        </Card>

        <Card title="Distance Snapshot" subtitle="Distance covered by reimbursement outcome">
          <BarDistanceChart data={reimbursementDistance} />
        </Card>
      </section>

      <section className="content-grid-2">
        <Card title="Latest Claim Records" subtitle="Most recent reimbursement entries">
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
              {latestClaims.map((claim) => (
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

        <Card title="Accountant Actions" subtitle="Read-only reimbursement workflow">
          <div className="list-stack">
            <article className="list-item">
              <div>
                <strong>Approved Amount</strong>
                <p>${approvedAmount.toFixed(2)} ready for reimbursement cycle</p>
              </div>
              <Badge status="approved" />
            </article>
            <article className="list-item">
              <div>
                <strong>Rejected Amount</strong>
                <p>${rejectedAmount.toFixed(2)} excluded from reimbursement</p>
              </div>
              <Badge status="rejected" />
            </article>
          </div>
          <div className="top-space">
            <Link to="/accountant/claims">
              <Button className="full-width">Open Claims Table</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
