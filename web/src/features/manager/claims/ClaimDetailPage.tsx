import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmDialog from "../../../components/feedback/ConfirmDialog";
import ToastHost from "../../../components/feedback/ToastHost";
import RouteMapPlaceholder from "../../../components/maps/RouteMapPlaceholder";
import { useToast } from "../../../hooks/useToast";
import { claims } from "../../../mocks/data";
import { ClaimStatus } from "../../../types/domain";

export default function ClaimDetailPage() {
  const { claimId } = useParams();
  const claim = useMemo(() => claims.find((item) => item.id === claimId), [claimId]);

  const [status, setStatus] = useState<ClaimStatus>(claim?.status ?? "pending");
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const { pushToast } = useToast();

  if (!claim) {
    return <EmptyState title="Claim Not Found" subtitle="Go back to the claims review list and try again." />;
  }

  const commitAction = (action: "approve" | "reject") => {
    const nextStatus: ClaimStatus = action === "approve" ? "approved" : "rejected";
    setStatus(nextStatus);
    pushToast({
      title: action === "approve" ? "Claim Approved" : "Claim Rejected",
      message: `${claim.employeeName}'s claim has been marked as ${nextStatus}.`,
      tone: action === "approve" ? "success" : "danger",
    });
    setDialog(null);
  };

  return (
    <div className="stack-24">
      <ToastHost />
      <Card title={`Claim ${claim.id}`} subtitle={`${claim.employeeName} · ${claim.date}`} action={<Badge status={status} />}>
        <div className="metrics-grid">
          <p>
            Amount <strong>${claim.amount.toFixed(2)}</strong>
          </p>
          <p>
            Distance <strong>{claim.distanceKm} km</strong>
          </p>
          <p>
            Duration <strong>{claim.durationMin} min</strong>
          </p>
          <p>
            Employee <strong>{claim.employeeName}</strong>
          </p>
        </div>
      </Card>

      <Card title="Route Taken" subtitle="Map placeholder for field route proof">
        <RouteMapPlaceholder origin={claim.route.origin} destination={claim.route.destination} />
      </Card>

      <Card title="Manager Decision" subtitle="Approve or reject this claim submission">
        <p className="muted">Reason: {claim.reason}</p>
        {status === "pending" ? (
          <div className="row gap-12 top-space">
            <Button variant="success" onClick={() => setDialog("approve")}>
              Approve
            </Button>
            <Button variant="danger" onClick={() => setDialog("reject")}>
              Reject
            </Button>
            <Link to="/manager/claims" className="link-inline">
              Back to Claims Review
            </Link>
          </div>
        ) : (
          <div className="top-space stack-16">
            <p className="muted">
              Decision finalized. This claim is marked as <strong>{status}</strong> and cannot be changed here.
            </p>
            <div>
              <Link to="/manager/claims" className="link-inline">
                Back to Claims Review
              </Link>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={dialog === "approve"}
        title="Approve Claim"
        description="This action will move the claim into approved state for reimbursement processing."
        confirmText="Approve Claim"
        confirmVariant="success"
        onCancel={() => setDialog(null)}
        onConfirm={() => commitAction("approve")}
      />

      <ConfirmDialog
        open={dialog === "reject"}
        title="Reject Claim"
        description="This action will mark the claim as rejected. The employee will need to resubmit with corrections."
        confirmText="Reject Claim"
        confirmVariant="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => commitAction("reject")}
      />
    </div>
  );
}
