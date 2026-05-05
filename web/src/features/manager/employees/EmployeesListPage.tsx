import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { apiClient } from "../../../lib/apiClient";

interface EmployeeItem {
  id: string;
  name: string;
  designation: string;
  status: "traveling" | "idle" | "offline";
  activeTrips: number;
  weeklyDistanceKm: number;
  weeklyTrips: number;
  claimsApproved: number;
  claimsRejected: number;
  city: string;
}

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <div className="stack-24"><p>Loading employees...</p></div>;

  return (
    <div className="stack-24">
      <Card title="Employees" subtitle="Click an employee to view weekly travel and claim details">
        <div className="grid-2">
          {employees.map((employee) => (
            <article className="employee-card" key={employee.id}>
              <div className="row-between">
                <div>
                  <h3>{employee.name}</h3>
                  <p>{employee.designation} · {employee.city}</p>
                </div>
                <Badge status={employee.status} />
              </div>
              <div className="metrics-grid">
                <p>Trips <strong>{employee.weeklyTrips}</strong></p>
                <p>Distance <strong>{employee.weeklyDistanceKm} km</strong></p>
                <p>Approved <strong>{employee.claimsApproved}</strong></p>
                <p>Rejected <strong>{employee.claimsRejected}</strong></p>
              </div>
              <Link to={`/manager/employees/${employee.id}`}>
                <Button variant="primary">View Details</Button>
              </Link>
            </article>
          ))}
          {employees.length === 0 && <p>No employees assigned to you.</p>}
        </div>
      </Card>
    </div>
  );
}
