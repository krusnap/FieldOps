import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import apiClient from "../../../lib/apiClient";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    apiClient.getEmployee(employeeId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="stack-16">
        <Skeleton height={100} />
        <Skeleton height={280} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (!data || !data.employee) {
    return <EmptyState title="Employee Not Found" subtitle="Select another employee from the monitoring list." />;
  }

  const { employee, trips, claims, stats } = data;

  return (
    <div className="stack-24">
      {/* Profile card */}
      <Card
        title={employee.full_name}
        subtitle={`${employee.email} · Rate: ₹${Number(employee.rate_per_km).toFixed(2)}/km`}
        action={
          <span className={`badge ${employee.is_active ? "badge-approved" : "badge-offline"}`}>
            {employee.is_active ? "Active" : "Inactive"}
          </span>
        }
      >
        <div className="metrics-grid">
          <p>Weekly Trips <strong>{stats.weeklyTrips}</strong></p>
          <p>Weekly Distance <strong>{stats.weeklyDistanceKm} km</strong></p>
          <p>Pending Claims <strong>{stats.pendingClaims}</strong></p>
          <p>Total Trips <strong>{stats.totalTrips}</strong></p>
        </div>
      </Card>

      {/* Trip history */}
      <Card title="Trip History" subtitle="Recent trips recorded by this employee">
        {trips.length === 0 ? (
          <EmptyState title="No Trips Yet" subtitle="Trips will appear here once the employee starts tracking." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 10).map((trip: any) => (
                <tr key={trip.id}>
                  <td>{new Date(trip.started_at).toLocaleDateString("en-IN")}</td>
                  <td>{Number(trip.total_distance_km).toFixed(1)} km</td>
                  <td>{trip.total_duration_seconds ? `${Math.round(trip.total_duration_seconds / 60)} min` : "—"}</td>
                  <td>
                    <span className={`badge badge-${trip.status === "completed" ? "approved" : trip.status === "active" ? "pending" : "offline"}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Claims history */}
      <Card title="Claims History" subtitle="Reimbursement claims for this employee">
        {claims.length === 0 ? (
          <EmptyState title="No Claims Yet" subtitle="Claims will appear after trips are completed." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.slice(0, 8).map((claim: any) => (
                <tr key={claim.id}>
                  <td>{claim.created_at ? new Date(claim.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>{claim.category ?? "Trip Reimbursement"}</td>
                  <td>₹{Number(claim.amount_inr).toFixed(2)}</td>
                  <td>{Number(claim.distance_km).toFixed(1)} km</td>
                  <td><Badge status={claim.status as any} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="top-space">
          <Link to="/manager/employees" className="link-inline">← Back to Employee Monitoring</Link>
        </div>
      </Card>
    </div>
  );
}
