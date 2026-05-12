import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import apiClient from "../../../lib/apiClient";

export default function AccountantClaimDetailPage() {
  const { claimId } = useParams();
  const [claim, setClaim] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        if (!claimId) return;
        const data = await apiClient.getClaim(claimId);
        if (!mounted) return;
        setClaim(data ?? null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load claim detail", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [claimId]);

  if (isLoading) {
    return <p>Loading claim...</p>;
  }

  if (!claim) {
    return <EmptyState title="Claim Not Found" subtitle="Return to claims table and try again." />;
  }

  return (
    <Card title={`Claim ${claim.id}`} subtitle="Read-only reimbursement details" action={<Badge status={claim.status} />}>
      <div className="metrics-grid">
        <p>
          Employee
          <strong>{claim.users?.full_name ?? claim.employee_email ?? claim.user_email ?? "Unknown"}</strong>
        </p>
        <p>
          Amount
          <strong>₹{Number(claim.amount_inr ?? claim.amount ?? 0).toFixed(2)}</strong>
        </p>
        <p>
          Status
          <strong>{claim.status}</strong>
        </p>
        <p>
          Distance
          <strong>{Number(claim.distance_km ?? 0).toFixed(1)} km</strong>
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
