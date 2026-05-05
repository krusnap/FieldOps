import { useCallback, useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Tabs from "../../../components/ui/Tabs";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { apiClient } from "../../../lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BundleItem {
  id: string;
  user_id: string;
  claim_date: string;
  status: "draft" | "pending" | "approved" | "rejected";
  total_amount_inr: number;
  total_distance_km: number;
  trip_count: number;
  notes: string | null;
  rejection_reason: string | null;
  users?: { id: string; full_name: string; email: string };
}

interface ClaimItem {
  id: string;
  category: string;
  amount_inr: number;
  distance_km: number;
  status: string;
  created_at: string;
  notes: string | null;
  rate_per_km: number;
}

interface FullBundle extends BundleItem {
  claims: ClaimItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const DATE_TABS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "All Time", value: "all" },
];

function getDateRange(period: string): { date_from?: string; date_to?: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (period === "today") return { date_from: today, date_to: today };
  if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { date_from: weekAgo, date_to: today };
  }
  return {};
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClaimsReviewPage() {
  const [statusTab, setStatusTab] = useState("pending");
  const [dateTab, setDateTab] = useState("week");
  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [bundleDetails, setBundleDetails] = useState<Record<string, FullBundle>>({});
  const [loading, setLoading] = useState(true);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<ClaimItem | null>(null);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);

  const loadBundles = useCallback(async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(dateTab);
      const data = await apiClient.getManagerBundles({
        status: statusTab === "all" ? undefined : statusTab,
        ...dateRange,
      });
      setBundles(data);
    } catch (err) {
      console.error("Failed to load bundles:", err);
    } finally {
      setLoading(false);
    }
  }, [statusTab, dateTab]);

  useEffect(() => { void loadBundles(); }, [loadBundles]);

  // Load employees for new claim modal
  useEffect(() => {
    apiClient.getEmployees().then((data: any[]) => setEmployees(data)).catch(() => {});
  }, []);

  const handleExpand = async (bundleId: string) => {
    if (expandedBundle === bundleId) { setExpandedBundle(null); return; }
    setExpandedBundle(bundleId);
    if (!bundleDetails[bundleId]) {
      try {
        const full = await apiClient.getBundle(bundleId);
        setBundleDetails((prev) => ({ ...prev, [bundleId]: full }));
      } catch { /* silent */ }
    }
  };

  const handleApprove = async (bundleId: string) => {
    if (!confirm("Approve this day's claims?")) return;
    try {
      await apiClient.approveBundle(bundleId);
      void loadBundles();
    } catch (err) { console.error("Approve failed:", err); }
  };

  const handleReject = async (bundleId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await apiClient.rejectBundle(bundleId, reason);
      void loadBundles();
    } catch (err) { console.error("Reject failed:", err); }
  };

  if (loading) return <div className="stack-24"><p>Loading claims...</p></div>;

  return (
    <div className="stack-24">
      <Card
        title="Claims Review"
        subtitle="Review employee daily claim bundles. Approve or reject per day."
        actions={
          <Button variant="primary" onClick={() => setShowNewClaimModal(true)}>
            + New Claim
          </Button>
        }
      >
        {/* Filters */}
        <div className="stack-12">
          <Tabs items={DATE_TABS} value={dateTab} onChange={setDateTab} />
          <Tabs items={STATUS_TABS} value={statusTab} onChange={setStatusTab} />
        </div>

        <div className="stack-16 top-space">
          {bundles.length === 0 && (
            <EmptyState
              title="No Claims Found"
              subtitle="Try changing the date range or status filter."
            />
          )}

          {bundles.map((bundle) => {
            const isExpanded = expandedBundle === bundle.id;
            const detail = bundleDetails[bundle.id];
            const employeeName = bundle.users?.full_name ?? "Employee";
            const isPending = bundle.status === "pending";
            const isRejected = bundle.status === "rejected";

            return (
              <article className="claim-card" key={bundle.id}>
                {/* Bundle header row */}
                <button
                  type="button"
                  className="claim-toggle"
                  onClick={() => handleExpand(bundle.id)}
                >
                  <div>
                    <strong>{employeeName}</strong>
                    <p className="claim-meta-line">
                      {formatDate(bundle.claim_date)}
                      {" · "}
                      {bundle.trip_count} trip{bundle.trip_count !== 1 ? "s" : ""}
                      {" · "}
                      {Number(bundle.total_distance_km).toFixed(1)} km
                      {" · "}
                      ₹{Number(bundle.total_amount_inr).toFixed(2)}
                    </p>
                    {isRejected && bundle.rejection_reason && (
                      <p className="claim-reject-reason">⚠ {bundle.rejection_reason}</p>
                    )}
                  </div>
                  <div className="row-center gap-12">
                    <Badge status={bundle.status as any} />
                    <span>{isExpanded ? "−" : "+"}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="claim-body">
                    {/* Employee note */}
                    {bundle.notes && (
                      <div className="claim-note-box">
                        <span className="claim-note-label">Employee note: </span>
                        <span>{bundle.notes}</span>
                      </div>
                    )}

                    {/* Individual trip claims */}
                    {detail ? (
                      <div className="claim-trips-list">
                        {detail.claims.length === 0 ? (
                          <p style={{ color: "#888", fontSize: 13 }}>No trip claims in this bundle.</p>
                        ) : (
                          detail.claims.map((claim, i) => (
                            <div className="claim-trip-row" key={claim.id}>
                              <span className="claim-trip-num">{i + 1}</span>
                              <div className="claim-trip-body">
                                <strong>{claim.category}</strong>
                                <span>{Number(claim.distance_km).toFixed(2)} km</span>
                              </div>
                              <strong>₹{Number(claim.amount_inr).toFixed(2)}</strong>
                              {/* Manager can override rejected trip claims */}
                              {claim.status === "rejected" && (
                                <Button
                                  variant="ghost"
                                  onClick={() => setOverrideTarget(claim)}
                                >
                                  Override
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <p style={{ color: "#888", fontSize: 13 }}>Loading trips...</p>
                    )}

                    {/* Actions */}
                    {isPending && (
                      <div className="row-center gap-12" style={{ marginTop: 14 }}>
                        <Button variant="primary" onClick={() => handleApprove(bundle.id)}>
                          ✓ Approve All
                        </Button>
                        <Button variant="ghost" onClick={() => handleReject(bundle.id)}>
                          ✗ Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Card>

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <NewClaimModal
          employees={employees}
          onClose={() => setShowNewClaimModal(false)}
          onCreated={() => { setShowNewClaimModal(false); void loadBundles(); }}
        />
      )}

      {/* Override Claim Modal */}
      {overrideTarget && (
        <OverrideClaimModal
          claim={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onOverridden={() => {
            setOverrideTarget(null);
            // Refresh bundle details so the UI reflects the change
            setBundleDetails({});
            void loadBundles();
          }}
        />
      )}
    </div>
  );
}

// ─── Override Claim Modal ─────────────────────────────────────────────────────

interface OverrideClaimModalProps {
  claim: ClaimItem;
  onClose: () => void;
  onOverridden: () => void;
}

function OverrideClaimModal({ claim, onClose, onOverridden }: OverrideClaimModalProps) {
  const ratePerKm = Number(claim.rate_per_km) || 10;
  const [km, setKm] = useState(String(Number(claim.distance_km).toFixed(2)));
  const [note, setNote] = useState(claim.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kmNum = parseFloat(km) || 0;
  const calculatedAmount = Math.round(kmNum * ratePerKm * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!km || kmNum <= 0) { setError("Enter a valid distance."); return; }
    try {
      setSaving(true);
      await apiClient.overrideClaim(claim.id, {
        distance_km: kmNum,
        notes: note || undefined,
      } as any);
      onOverridden();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to override claim.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Override Rejected Claim</h2>
          <button type="button" onClick={onClose} className="modal-close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Category: <strong>{claim.category}</strong>
            &nbsp;·&nbsp;Rate: <strong>₹{ratePerKm}/km</strong>
          </p>

          <div className="form-group">
            <label>Corrected Distance (km) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 12.50"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Live amount preview */}
          <div className="override-amount-preview">
            <span>Corrected Amount</span>
            <strong>₹{calculatedAmount.toFixed(2)}</strong>
            <small>{kmNum.toFixed(2)} km × ₹{ratePerKm}/km</small>
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Reason for correction..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="row-center gap-12">
            <Button variant="primary" type="submit">
              {saving ? "Saving..." : "Apply Override"}
            </Button>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Override claim helper (now unused — kept for reference) ──────────────────
async function handleOverrideClaim(claimId: string) {
  const newAmount = prompt("Enter corrected amount (₹):");
  if (!newAmount || isNaN(Number(newAmount))) return;
  const note = prompt("Add a note (optional):") ?? "";
  try {
    await apiClient.overrideClaim(claimId, { amount_inr: Number(newAmount), notes: note });
    alert("Claim overridden and moved to pending.");
    window.location.reload();
  } catch { alert("Failed to override claim."); }
}

// ─── New Claim Modal ──────────────────────────────────────────────────────────

interface NewClaimModalProps {
  employees: { id: string; full_name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

function NewClaimModal({ employees, onClose, onCreated }: NewClaimModalProps) {
  const [form, setForm] = useState({
    user_id: "",
    amount_inr: "",
    distance_km: "",
    category: "Trip Reimbursement",
    notes: "",
    status: "pending" as "pending" | "approved",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.user_id) { setError("Select an employee."); return; }
    if (!form.amount_inr || isNaN(Number(form.amount_inr))) { setError("Enter a valid amount."); return; }
    try {
      setSaving(true);
      await apiClient.createManagerClaim({
        user_id: form.user_id,
        amount_inr: Number(form.amount_inr),
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        category: form.category,
        notes: form.notes || undefined,
        status: form.status,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to create claim.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Claim</h2>
          <button type="button" onClick={onClose} className="modal-close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form stack-16">
          <div className="form-group">
            <label>Employee *</label>
            <select
              value={form.user_id}
              onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
              required
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option>Trip Reimbursement</option>
              <option>Fuel Expense</option>
              <option>Toll Expense</option>
              <option>Accommodation</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount_inr}
                onChange={(e) => setForm((f) => ({ ...f, amount_inr: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Distance (km)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.distance_km}
                onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={3}
              placeholder="Optional note..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Submit as</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "pending" | "approved" }))}
            >
              <option value="pending">Pending (employee to review)</option>
              <option value="approved">Approved (direct approval)</option>
            </select>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="row-center gap-12">
            <Button variant="primary" type="submit">
              {saving ? "Creating..." : "Create Claim"}
            </Button>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
