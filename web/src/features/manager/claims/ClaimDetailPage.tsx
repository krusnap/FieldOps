import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import apiClient from "../../../lib/apiClient";

export default function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    apiClient.getClaim(claimId)
      .then(setClaim)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [claimId]);

  if (loading) return <p style={{ padding: 24 }}>Loading claim...</p>;

  if (!claim) {
    return <EmptyState title="Claim Not Found" subtitle="Go back to claims review and try again." />;
  }

  const employeeName = claim.users?.full_name ?? claim.user_email ?? "Unknown Employee";
  const amountInr    = Number(claim.amount_inr ?? 0);
  const distanceKm   = Number(claim.distance_km ?? 0);

  return (
    <div className="stack-24">
      <Card
        title={`Claim — ${new Date(claim.created_at).toLocaleDateString("en-IN")}`}
        subtitle={`${employeeName} · ${claim.category ?? "Trip Reimbursement"}`}
        action={<Badge status={claim.status as any} />}
      >
        <div className="metrics-grid">
          <p>Amount     <strong>₹{amountInr.toFixed(2)}</strong></p>
          <p>Distance   <strong>{distanceKm.toFixed(1)} km</strong></p>
          <p>Rate       <strong>₹{Number(claim.rate_per_km ?? 0).toFixed(2)}/km</strong></p>
          <p>Status     <strong>{claim.status}</strong></p>
        </div>

        {claim.notes && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-subtle)", borderRadius: 10 }}>
            <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>NOTE</p>
            <p style={{ fontSize: "0.92rem" }}>{claim.notes}</p>
          </div>
        )}
      </Card>

      <div className="top-space">
        <Link to="/manager/claims" className="link-inline">← Back to Claims Review</Link>
      </div>
    </div>
  );
}
