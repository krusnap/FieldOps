import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import RouteMapPlaceholder from "../../../components/maps/RouteMapPlaceholder";
import { employees, tripHistory } from "../../../mocks/data";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, [employeeId]);

  const employee = useMemo(() => employees.find((item) => item.id === employeeId), [employeeId]);
  const trips = useMemo(() => tripHistory.filter((item) => item.employeeId === employeeId), [employeeId]);

  if (loading) {
    return (
      <div className="stack-16">
        <Skeleton height={100} />
        <Skeleton height={280} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (!employee) {
    return <EmptyState title="Employee Not Found" subtitle="Select another employee from the monitoring list." />;
  }

  return (
    <div className="stack-24">
      <Card title={employee.name} subtitle={`${employee.designation} · ${employee.city}`}>
        <div className="metrics-grid">
          <p>
            Total Trips <strong>{employee.weeklyTrips}</strong>
          </p>
          <p>
            Total Distance <strong>{employee.weeklyDistanceKm} km</strong>
          </p>
          <p>
            Claims Approved <strong>{employee.claimsApproved}</strong>
          </p>
          <p>
            Claims Rejected <strong>{employee.claimsRejected}</strong>
          </p>
        </div>
      </Card>

      <Card title="Route Map" subtitle="Selected day route visualization">
        <RouteMapPlaceholder origin="Primary Office" destination="Latest client destination" />
      </Card>

      <Card title="Trip History" subtitle="Recent travel records">
        {trips.length === 0 ? (
          <EmptyState title="No Trips Recorded" subtitle="Trips for this employee will appear once available." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Route</th>
                <th>Distance</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.date}</td>
                  <td>
                    {trip.origin} {"->"} {trip.destination}
                  </td>
                  <td>{trip.distanceKm} km</td>
                  <td>{trip.durationMin} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="top-space">
          <Link to="/manager/employees" className="link-inline">
            Back to Employee Monitoring
          </Link>
        </div>
      </Card>
    </div>
  );
}
