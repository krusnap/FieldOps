import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { claims } from "../../../mocks/data";

export default function AccountantClaimsPage() {
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");

  const filtered = useMemo(() => {
    return claims.filter((claim) => {
      const statusOk = status === "all" || claim.status === status;
      const dateOk = !date || claim.date === date;
      return statusOk && dateOk;
    });
  }, [status, date]);

  return (
    <Card title="Claims Table" subtitle="Read-only claims for reimbursement processing">
      <div className="filter-row">
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </label>
      </div>

      <table className="table top-space">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Distance</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((claim) => (
            <tr key={claim.id}>
              <td>{claim.employeeName}</td>
              <td>{claim.date}</td>
              <td>{claim.distanceKm} km</td>
              <td>${claim.amount.toFixed(2)}</td>
              <td>
                <Badge status={claim.status} />
              </td>
              <td>
                <Link className="link-inline" to={`/accountant/claims/${claim.id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
