import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { employees } from "../../../mocks/data";

export default function EmployeesListPage() {
  return (
    <div className="stack-24">
      <Card title="Employees" subtitle="Click an employee to view weekly travel and claim details">
        <div className="grid-2">
          {employees.map((employee) => (
            <article className="employee-card" key={employee.id}>
              <div className="row-between">
                <div>
                  <h3>{employee.name}</h3>
                  <p>
                    {employee.designation} · {employee.city}
                  </p>
                </div>
                <Badge status={employee.status} />
              </div>

              <div className="metrics-grid">
                <p>
                  Trips <strong>{employee.weeklyTrips}</strong>
                </p>
                <p>
                  Distance <strong>{employee.weeklyDistanceKm} km</strong>
                </p>
                <p>
                  Approved <strong>{employee.claimsApproved}</strong>
                </p>
                <p>
                  Rejected <strong>{employee.claimsRejected}</strong>
                </p>
              </div>

              <Link to={`/manager/employees/${employee.id}`}>
                <Button variant="primary">View Details</Button>
              </Link>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
