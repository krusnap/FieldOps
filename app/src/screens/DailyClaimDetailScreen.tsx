import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import api, { BundleData, ClaimData } from "../services/api";
import { colors } from "../theme/colors";

type DailyClaimDetailScreenProps = {
  bundleId: string;
  onBack: () => void;
  onSelectTab: (tab: BottomTabKey) => void;
};

type FullBundle = BundleData & { claims: ClaimData[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

type StatusConfig = { label: string; bg: string; text: string; icon: keyof typeof MaterialIcons.glyphMap };
function getStatus(status: BundleData["status"]): StatusConfig {
  switch (status) {
    case "draft":     return { label: "Draft",    bg: "#F3F4F6", text: "#6B7280", icon: "edit-note" };
    case "pending":   return { label: "Pending",  bg: "#DBEAFE", text: "#1D4ED8", icon: "schedule" };
    case "approved":  return { label: "Approved", bg: "#D1FAE5", text: "#065F46", icon: "check-circle" };
    case "rejected":  return { label: "Rejected", bg: "#FEE2E2", text: "#991B1B", icon: "cancel" };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function DailyClaimDetailScreen({ bundleId, onBack, onSelectTab }: DailyClaimDetailScreenProps) {
  const [bundle, setBundle] = useState<FullBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [note, setNote] = useState("");
  const [noteChanged, setNoteChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.bundles.getById(bundleId);
      setBundle(data);
      setNote(data.notes ?? "");
    } catch {
      setError("Failed to load claim details.");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => { void load(); }, [load]);

  const handleSaveNote = async () => {
    if (!bundle || !noteChanged) return;
    try {
      setSavingNote(true);
      const updated = await api.bundles.addNote(bundleId, note);
      setBundle((prev) => prev ? { ...prev, notes: updated.notes } : prev);
      setNoteChanged(false);
    } catch {
      Alert.alert("Error", "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleSubmit = async () => {
    if (!bundle) return;
    Alert.alert(
      "Submit Day's Claims",
      `Submit ₹${Number(bundle.total_amount_inr).toFixed(2)} across ${bundle.trip_count} trip(s) for manager approval?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: async () => {
            try {
              setSubmitting(true);
              const updated = await api.bundles.submit(bundleId);
              setBundle((prev) => prev ? { ...prev, ...updated } : prev);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Failed to submit.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const st = bundle ? getStatus(bundle.status) : null;
  const isDraft = bundle?.status === "draft";
  const isRejected = bundle?.status === "rejected";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <MaterialIcons color={colors.indigo700} name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {bundle ? formatDate(bundle.claim_date) : "Claim Detail"}
        </Text>
        {st && (
          <View style={[styles.headerBadge, { backgroundColor: st.bg }]}>
            <MaterialIcons color={st.text} name={st.icon} size={13} />
            <Text style={[styles.headerBadgeText, { color: st.text }]}>{st.label}</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerWrap}>
          <MaterialIcons color={colors.error} name="cloud-off" size={40} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && bundle && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryStat icon="directions" label="Trips" value={String(bundle.trip_count)} />
              <View style={styles.summaryDivider} />
              <SummaryStat icon="straighten" label="Distance" value={`${Number(bundle.total_distance_km).toFixed(1)} km`} />
              <View style={styles.summaryDivider} />
              <SummaryStat icon="currency-rupee" label="Total" value={`₹${Number(bundle.total_amount_inr).toFixed(2)}`} />
            </View>
          </View>

          {/* Rejection reason */}
          {isRejected && bundle.rejection_reason && (
            <View style={styles.rejectionCard}>
              <View style={styles.rejectionTitle}>
                <MaterialIcons color="#991B1B" name="cancel" size={16} />
                <Text style={styles.rejectionTitleText}>Rejected by Manager</Text>
              </View>
              <Text style={styles.rejectionReason}>{bundle.rejection_reason}</Text>
              <Text style={styles.rejectionHint}>
                Please contact your manager to resolve this claim.
              </Text>
            </View>
          )}

          {/* Trip claims list */}
          <Text style={styles.sectionTitle}>TRIP CLAIMS</Text>
          {bundle.claims.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No trip claims in this bundle.</Text>
            </View>
          ) : (
            bundle.claims.map((claim, i) => (
              <ClaimRow key={claim.id} claim={claim} index={i + 1} />
            ))
          )}

          {/* Note section — only editable on draft */}
          {isDraft && (
            <View style={styles.noteCard}>
              <Text style={styles.sectionTitle}>NOTE TO MANAGER</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={(v) => { setNote(v); setNoteChanged(true); }}
                placeholder="Add an optional note for your manager..."
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                maxLength={500}
                returnKeyType="done"
              />
              {noteChanged && (
                <Pressable
                  onPress={handleSaveNote}
                  style={[styles.saveNoteBtn, savingNote && { opacity: 0.6 }]}
                  disabled={savingNote}
                >
                  <Text style={styles.saveNoteBtnText}>
                    {savingNote ? "Saving..." : "Save Note"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Read-only note for non-draft */}
          {!isDraft && bundle.notes && (
            <View style={styles.noteCard}>
              <Text style={styles.sectionTitle}>YOUR NOTE</Text>
              <Text style={styles.noteReadOnly}>{bundle.notes}</Text>
            </View>
          )}

          {/* Submit button */}
          {isDraft && (
            <Pressable
              style={[styles.submitBtn, (submitting || bundle.trip_count === 0) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting || bundle.trip_count === 0}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <MaterialIcons color={colors.onPrimary} name="send" size={18} />
              )}
              <Text style={styles.submitBtnText}>
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Text>
            </Pressable>
          )}

          {/* Pending state info */}
          {bundle.status === "pending" && (
            <View style={styles.pendingInfo}>
              <MaterialIcons color="#1D4ED8" name="schedule" size={18} />
              <Text style={styles.pendingInfoText}>
                Submitted. Awaiting manager approval.
              </Text>
            </View>
          )}

          {/* Approved state info */}
          {bundle.status === "approved" && (
            <View style={styles.approvedInfo}>
              <MaterialIcons color="#065F46" name="check-circle" size={18} />
              <Text style={styles.approvedInfoText}>
                Approved{bundle.reviewed_at ? ` on ${new Date(bundle.reviewed_at).toLocaleDateString("en-IN")}` : ""}.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <BottomNav activeTab="claims" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStat({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <MaterialIcons color={colors.primary} name={icon} size={16} />
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

function ClaimRow({ claim, index }: { claim: ClaimData; index: number }) {
  const startTime = claim.trips?.started_at ? formatTime(claim.trips.started_at) : "--:--";
  return (
    <View style={styles.claimRow}>
      <View style={styles.claimNum}>
        <Text style={styles.claimNumText}>{index}</Text>
      </View>
      <View style={styles.claimBody}>
        <Text style={styles.claimTitle}>{claim.category}</Text>
        <View style={styles.claimMeta}>
          <MaterialIcons color={colors.onSurfaceVariant} name="schedule" size={12} />
          <Text style={styles.claimMetaText}>{startTime}</Text>
          <MaterialIcons color={colors.onSurfaceVariant} name="straighten" size={12} />
          <Text style={styles.claimMetaText}>{Number(claim.distance_km).toFixed(2)} km</Text>
        </View>
      </View>
      <Text style={styles.claimAmount}>₹{Number(claim.amount_inr).toFixed(2)}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 14 },

  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: colors.indigo900, fontSize: 16, fontWeight: "800" },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  headerBadgeText: { fontSize: 11, fontWeight: "800" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: colors.onSurfaceVariant, fontSize: 13, fontWeight: "600" },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600", textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },

  summaryCard: {
    backgroundColor: colors.primaryFixed, borderRadius: 16, padding: 16, marginTop: 14,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryStat: { flex: 1, alignItems: "center", gap: 4 },
  summaryStatValue: { color: colors.onSurface, fontSize: 18, fontWeight: "900" },
  summaryStatLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.outlineVariant },

  rejectionCard: {
    backgroundColor: "#FEE2E2", borderRadius: 14, padding: 14, gap: 6,
    borderWidth: 1, borderColor: "#FECACA",
  },
  rejectionTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  rejectionTitleText: { color: "#991B1B", fontSize: 13, fontWeight: "800" },
  rejectionReason: { color: "#991B1B", fontSize: 13, lineHeight: 19 },
  rejectionHint: { color: "#B91C1C", fontSize: 12, fontStyle: "italic" },

  sectionTitle: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },

  emptyWrap: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 13 },

  claimRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 12,
  },
  claimNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryFixed,
    alignItems: "center", justifyContent: "center",
  },
  claimNumText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  claimBody: { flex: 1, gap: 4 },
  claimTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "700" },
  claimMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  claimMetaText: { color: colors.onSurfaceVariant, fontSize: 12 },
  claimAmount: { color: colors.onSurface, fontSize: 15, fontWeight: "900" },

  noteCard: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: 14, padding: 14, gap: 10,
  },
  noteInput: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 10,
    padding: 12, minHeight: 80, textAlignVertical: "top",
    color: colors.onSurface, fontSize: 14, lineHeight: 20,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  saveNoteBtn: {
    backgroundColor: colors.secondary, borderRadius: 999,
    alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 7,
  },
  saveNoteBtnText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" },
  noteReadOnly: { color: colors.onSurface, fontSize: 14, lineHeight: 20, fontStyle: "italic" },

  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: "900" },

  pendingInfo: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#DBEAFE", borderRadius: 12, padding: 14,
  },
  pendingInfoText: { color: "#1D4ED8", fontSize: 13, fontWeight: "700", flex: 1 },

  approvedInfo: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#D1FAE5", borderRadius: 12, padding: 14,
  },
  approvedInfoText: { color: "#065F46", fontSize: 13, fontWeight: "700", flex: 1 },
});
