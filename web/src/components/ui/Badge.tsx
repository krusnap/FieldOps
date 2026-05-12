import { ClaimStatus, EmployeeStatus } from "../../types/domain";

const STATUS_CLASS: Record<string, string> = {
  approved:  "badge-approved",
  rejected:  "badge-rejected",
  pending:   "badge-pending",
  draft:     "badge-draft",
  traveling: "badge-approved",
  idle:      "badge-offline",
  offline:   "badge-offline",
};

const STATUS_LABEL: Record<string, string> = {
  approved:  "Approved",
  rejected:  "Rejected",
  pending:   "Pending",
  draft:     "Draft",
  traveling: "Traveling",
  idle:      "Idle",
  offline:   "Offline",
};

interface BadgeProps {
  status: ClaimStatus | EmployeeStatus | string;
}

export default function Badge({ status }: BadgeProps) {
  const cls   = STATUS_CLASS[status]  ?? "badge-offline";
  const label = STATUS_LABEL[status]  ?? status;
  return <span className={`badge ${cls}`}>{label}</span>;
}
