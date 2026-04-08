import { ClaimStatus, EmployeeStatus } from "../../types/domain";

interface BadgeProps {
  status: ClaimStatus | EmployeeStatus;
}

export default function Badge({ status }: BadgeProps) {
  const statusClass = `badge badge-${status}`;
  return <span className={statusClass}>{status}</span>;
}
