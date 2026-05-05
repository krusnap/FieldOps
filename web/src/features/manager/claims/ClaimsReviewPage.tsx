import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Tabs from "../../../components/ui/Tabs";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { apiClient } from "../../../lib/apiClient";

const tabItems = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

interface ClaimItem {
  id: string;
  user_id: string;
  amount_inr: number;
  distance_km: number;
  status: string;
  category: string;
  created_at: string;
  trip_id: string | null;
  users?: { full_name: string; email: string };
}

export default function ClaimsReviewPage() {
  const [tab, setTab] = useState("all");
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClaims = useCallback(async () => {
    try {
      const data = await apiClient.getClaims(tab === "all" ? undefined : tab);
      setClaims(data);
      if (data.length > 0 && !expanded) setExpanded(data[0].id);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void loadClaims(); }, [loadClaims]);

  const handleApprove = async (claimId: string) => {
    try {
      await apiClient.approveClaim(claimId);
      void loadClaims();
    } catch (err) { console.error("Approve failed:", err); }
  };

  const handleReject = async (claimId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await apiClient.rejectClaim(claimId, reason);
      void loadClaims();
    } catch (err) { console.error("Reject failed:", err); }
  };

  if (loading) return <div className="stack-24"><p>Loading claims...</p></div>;

  return (
    <div className="stack-24">
      <Card title="Claims Review" subtitle="Expand each claim for details. Approve or reject.">
        <Tabs items={tabItems} value={tab} onChange={setTab} />

        <div className="stack-16 top-space">
          {claims.length === 0 && (
            <EmptyState title="No Claims Found" subtitle="Try changing the status filter." />
          )}

          {claims.map((claim) => {
            const isExpanded = expanded === claim.id;
            const employeeName = (claim as any).users?.full_name ?? "Employee";
            const date = new Date(claim.created_at).toLocaleDateString();
            return (
              <article className="claim-card" key={claim.id}>
                <button
                  type="button"
                  className="claim-toggle"
                  onClick={() => setExpanded(isExpanded ? null : claim.id)}
                >
                  <div>
                    <strong>{employeeName}</strong>
                    <p>
                      {date} · ₹{Number(claim.amount_inr).toFixed(2)} · {claim.distance_km} km
                    </p>
                  </div>
                  <div className="row-center gap-12">
                    <Badge status={claim.status as any} />
                    <span>{isExpanded ? "-" : "+"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="claim-body">
                    <p>Category: {claim.category}</p>
                    <p>Distance: {claim.distance_km} km</p>
                    <p>Amount: ₹{Number(claim.amount_inr).toFixed(2)}</p>
                    <div className="row-center gap-12" style={{ marginTop: 12 }}>
                      <Link to={`/manager/claims/${claim.id}`}>
                        <Button variant="primary">Open Detail</Button>
                      </Link>
                      {claim.status === "pending" && (
                        <>
                          <Button variant="primary" onClick={() => handleApprove(claim.id)}>
                            Approve
                          </Button>
                          <Button variant="ghost" onClick={() => handleReject(claim.id)}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
