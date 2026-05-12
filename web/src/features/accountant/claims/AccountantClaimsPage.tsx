import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import apiClient from "../../../lib/apiClient";

export default function AccountantClaimsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [bundles, setBundles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.getAccountantDashboard()
      .then((data) => setBundles(data?.recentAll ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return bundles.filter((b) => {
      const statusOk = statusFilter === "all" || b.status === statusFilter;
      const dateOk   = !dateFilter || b.date === dateFilter;
      return statusOk && dateOk;
    });
  }, [statusFilter, dateFilter, bundles]);

  return (
    <Card title="Claims Table" subtitle="Daily claim bundles — read-only for reimbursement processing">
      {isLoading ? <p>Loading records...</p> : null}

      <div className="filter-row">
        <label>
          Date
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
            <th>Trips</th>
            <th>Distance</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                {isLoading ? "Loading..." : "No records found"}
              </td>
            </tr>
          ) : filtered.map((b) => (
            <tr key={b.id}>
              <td>{b.employeeName}</td>
              <td>{b.date}</td>
              <td>{b.tripCount}</td>
              <td>{Number(b.distanceKm).toFixed(1)} km</td>
              <td>₹{Number(b.amountInr).toFixed(2)}</td>
              <td><Badge status={b.status as any} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
