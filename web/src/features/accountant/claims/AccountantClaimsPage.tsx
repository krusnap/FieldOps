import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import apiClient from "../../../lib/apiClient";

// Fetch claims from API instead of using mock data

export default function AccountantClaimsPage() {
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getClaims();
        if (!mounted) return;
        setClaimsList(data ?? []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load claims", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return claimsList.filter((claim) => {
      const statusOk = status === "all" || claim.status === status;
      const dateOk = !date || claim.date === date;
      return statusOk && dateOk;
    });
  }, [status, date, claimsList]);

  return (
    <Card title="Claims Table" subtitle="Read-only claims for reimbursement processing">
      {isLoading ? <p>Loading claims...</p> : null}
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
              <td>{claim.employeeName || claim.employee_email || claim.user_email}</td>
              <td>{claim.date}</td>
              <td>{(claim.distanceKm ?? claim.distance_km ?? 0)} km</td>
              <td>${(claim.amount ?? claim.amount_inr ?? 0).toFixed(2)}</td>
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
