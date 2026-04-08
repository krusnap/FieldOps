import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Tabs from "../../../components/ui/Tabs";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { claims } from "../../../mocks/data";
import { ClaimStatus } from "../../../types/domain";

const tabItems = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function ClaimsReviewPage() {
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(claims[0]?.id ?? null);

  const filteredClaims = useMemo(() => {
    if (tab === "all") return claims;
    return claims.filter((claim) => claim.status === (tab as ClaimStatus));
  }, [tab]);

  return (
    <div className="stack-24">
      <Card title="Claims Review" subtitle="Expand each claim for route, distance, and purpose">
        <Tabs items={tabItems} value={tab} onChange={setTab} />

        <div className="stack-16 top-space">
          {filteredClaims.length === 0 && (
            <EmptyState title="No Claims in This Segment" subtitle="Try changing the claim status tab." />
          )}

          {filteredClaims.map((claim) => {
            const isExpanded = expanded === claim.id;
            return (
              <article className="claim-card" key={claim.id}>
                <button
                  type="button"
                  className="claim-toggle"
                  onClick={() => setExpanded(isExpanded ? null : claim.id)}
                >
                  <div>
                    <strong>{claim.employeeName}</strong>
                    <p>
                      {claim.date} · ${claim.amount.toFixed(2)} · {claim.distanceKm} km
                    </p>
                  </div>
                  <div className="row-center gap-12">
                    <Badge status={claim.status} />
                    <span>{isExpanded ? "-" : "+"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="claim-body">
                    <p>
                      Route: {claim.route.origin} {"->"} {claim.route.destination}
                    </p>
                    <p>Reason: {claim.reason}</p>
                    <Link to={`/manager/claims/${claim.id}`}>
                      <Button variant="primary">Open Claim Detail</Button>
                    </Link>
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
