import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import api, { BundleData } from "../services/api";
import { colors } from "../theme/colors";

type ClaimsScreenProps = {
  onOpenBundle: (bundleId: string) => void;
  onSelectTab: (tab: BottomTabKey) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  // dateStr is "2026-05-05"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export function ClaimsScreen({ onOpenBundle, onSelectTab }: ClaimsScreenProps) {
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await api.bundles.list();
      setBundles(data);
    } catch {
      setError("Failed to load claims. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Summary counts
  const draftCount = bundles.filter((b) => b.status === "draft").length;
  const pendingCount = bundles.filter((b) => b.status === "pending").length;
  const totalDraft = bundles
    .filter((b) => b.status === "draft")
    .reduce((s, b) => s + Number(b.total_amount_inr), 0);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <Text style={styles.kicker}>EXPENSE CENTER</Text>
        <Text style={styles.pageTitle}>Claims</Text>

        {/* Summary banner */}
        {(draftCount > 0 || pendingCount > 0) && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              {draftCount > 0 && (
                <View style={styles.summaryChip}>
                  <View style={[styles.summaryDot, { backgroundColor: "#9CA3AF" }]} />
                  <Text style={styles.summaryChipText}>{draftCount} Draft</Text>
                </View>
              )}
              {pendingCount > 0 && (
                <View style={styles.summaryChip}>
                  <View style={[styles.summaryDot, { backgroundColor: "#3B82F6" }]} />
                  <Text style={styles.summaryChipText}>{pendingCount} Pending</Text>
                </View>
              )}
            </View>
            {totalDraft > 0 && (
              <Text style={styles.summaryHint}>
                ₹{totalDraft.toFixed(2)} awaiting your submission
              </Text>
            )}
          </View>
        )}

        {/* List header */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>DAILY BUNDLES</Text>
          <Text style={styles.totalCount}>{bundles.length} day{bundles.length !== 1 ? "s" : ""}</Text>
        </View>

        {loading && (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading claims...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerWrap}>
            <MaterialIcons color={colors.error} name="cloud-off" size={40} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && bundles.length === 0 && (
          <View style={styles.centerWrap}>
            <MaterialIcons color={colors.onSurfaceVariant} name="receipt-long" size={48} />
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete a trip to automatically create your first daily claim bundle.
            </Text>
          </View>
        )}

        {!loading && !error && bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} onOpen={onOpenBundle} />
        ))}
      </ScrollView>

      <BottomNav activeTab="claims" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({ bundle, onOpen }: { bundle: BundleData; onOpen: (id: string) => void }) {
  const st = getStatus(bundle.status);

  return (
    <Pressable style={styles.card} onPress={() => onOpen(bundle.id)}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>{formatDate(bundle.claim_date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <MaterialIcons color={st.text} name={st.icon} size={12} />
          <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{bundle.trip_count}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Number(bundle.total_distance_km).toFixed(1)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹{Number(bundle.total_amount_inr).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Amount</Text>
        </View>
      </View>

      {/* Rejected reason */}
      {bundle.status === "rejected" && bundle.rejection_reason && (
        <View style={styles.rejectedRow}>
          <MaterialIcons color={colors.error} name="info-outline" size={13} />
          <Text style={styles.rejectedText} numberOfLines={2}>{bundle.rejection_reason}</Text>
        </View>
      )}

      {/* CTA */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>
          {bundle.status === "draft" ? "Review & Submit →" : "View Details →"}
        </Text>
        {bundle.status === "draft" && (
          <View style={styles.draftAlert}>
            <MaterialIcons color="#92400E" name="pending" size={12} />
            <Text style={styles.draftAlertText}>Action needed</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 140, gap: 12 },

  kicker: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  pageTitle: { color: colors.indigo900, fontSize: 32, fontWeight: "900", letterSpacing: -0.6 },

  summaryCard: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 14, padding: 14, gap: 8,
  },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryChipText: { color: colors.onSurface, fontSize: 13, fontWeight: "700" },
  summaryHint: { color: colors.primary, fontSize: 12, fontWeight: "600" },

  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  totalCount: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "700" },

  centerWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  loadingText: { color: colors.onSurfaceVariant, fontSize: 13, fontWeight: "600" },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "800" },
  emptySubtitle: { color: colors.onSurfaceVariant, fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 20 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },

  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardDate: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },

  cardStats: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12, padding: 12,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: colors.onSurface, fontSize: 15, fontWeight: "900" },
  statLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  statDivider: { width: 1, height: 28, backgroundColor: colors.outlineVariant },

  rejectedRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#FEE2E2", borderRadius: 8, padding: 8,
  },
  rejectedText: { color: "#991B1B", fontSize: 12, fontWeight: "600", flex: 1 },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardCta: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  draftAlert: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  draftAlertText: { color: "#92400E", fontSize: 11, fontWeight: "700" },
});
