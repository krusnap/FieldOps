import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import { claims } from "../../../mocks/data";

export default function AccountantClaimDetailPage() {
  const { claimId } = useParams();
  const claim = useMemo(() => claims.find((item) => item.id === claimId), [claimId]);

  if (!claim) {
    return <EmptyState title="Claim Not Found" subtitle="Return to claims table and try again." />;
  }

  return (
    <Card title={`Claim ${claim.id}`} subtitle="Read-only reimbursement details" action={<Badge status={claim.status} />}>
      <div className="metrics-grid">
        <p>
          Employee
          <strong>{claim.employeeName}</strong>
        </p>
        <p>
          Amount
          <strong>${claim.amount.toFixed(2)}</strong>
        </p>
        <p>
          Status
          <strong>{claim.status}</strong>
        </p>
        <p>
          Distance
          <strong>{claim.distanceKm} km</strong>
        </p>
      </div>
      <div className="top-space">
        <Link className="link-inline" to="/accountant/claims">
          Back to Claims
        </Link>
      </div>
    </Card>
  );
}
