import Card from "../../../components/ui/Card";
import { managerAssignments } from "../../../mocks/data";

export default function ManagerControlPage() {
  return (
    <Card title="Manager Control" subtitle="Assign employees to managers and monitor reporting hierarchy">
      <div className="stack-16">
        {managerAssignments.map((item) => (
          <div key={item.manager} className="hierarchy-card">
            <h4>{item.manager}</h4>
            <p>Assigned Employees</p>
            <div className="tag-wrap">
              {item.employees.map((employee) => (
                <span key={employee} className="soft-tag">
                  {employee}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
