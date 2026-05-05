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
import api, { TripData } from "../services/api";
import { colors } from "../theme/colors";

type TripDetailsScreenProps = {
  employeeName: string;
  onSelectTab: (tab: BottomTabKey) => void;
  region: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type StatusConfig = { label: string; bg: string; text: string };
function getStatusConfig(status: string): StatusConfig {
  switch (status.toLowerCase()) {
    case "completed":
      return { label: "Completed", bg: "#D1FAE5", text: "#065F46" };
    case "active":
    case "in_progress":
      return { label: "Active", bg: "#DBEAFE", text: "#1E40AF" };
    case "paused":
      return { label: "Paused", bg: "#FEF3C7", text: "#92400E" };
    default:
      return { label: status, bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TripDetailsScreen({ employeeName, onSelectTab, region }: TripDetailsScreenProps) {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const result = await api.trips.getHistory(1, 50);
      setTrips(result.trips);
      setTotal(result.total);
    } catch {
      setError("Failed to load trips. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  // Summary stats
  const completedTrips = trips.filter((t) => t.status === "completed");
  const totalDistanceKm = completedTrips.reduce((s, t) => s + Number(t.total_distance_km), 0);
  const totalDurationSecs = completedTrips.reduce((s, t) => s + Number(t.total_duration_seconds), 0);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTrips(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>FIELD HISTORY</Text>
            <Text style={styles.pageTitle}>My Trips</Text>
          </View>
          <View style={styles.regionPill}>
            <MaterialIcons color={colors.primary} name="location-on" size={13} />
            <Text style={styles.regionText}>{region}</Text>
          </View>
        </View>

        {/* Summary banner */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryName}>{employeeName}</Text>
          <View style={styles.summaryStats}>
            <SummaryStat
              icon="directions"
              label="Total Trips"
              value={String(completedTrips.length)}
            />
            <View style={styles.summaryDivider} />
            <SummaryStat
              icon="straighten"
              label="Total Distance"
              value={`${totalDistanceKm.toFixed(1)} km`}
            />
            <View style={styles.summaryDivider} />
            <SummaryStat
              icon="timer"
              label="Total Time"
              value={formatDuration(totalDurationSecs)}
            />
          </View>
        </View>

        {/* Trip list */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>ALL TRIPS</Text>
          <Text style={styles.totalCount}>{total} record{total !== 1 ? "s" : ""}</Text>
        </View>

        {loading && (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerWrap}>
            <MaterialIcons color={colors.error} name="cloud-off" size={40} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => loadTrips()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && trips.length === 0 && (
          <View style={styles.centerWrap}>
            <MaterialIcons color={colors.onSurfaceVariant} name="directions-off" size={48} />
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>Start a trip from the Dashboard to see your history here.</Text>
          </View>
        )}

        {!loading && !error && trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </ScrollView>

      <BottomNav activeTab="trips" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: TripData }) {
  const status = getStatusConfig(trip.status);
  const distanceKm = Number(trip.total_distance_km).toFixed(2);
  const avgSpeed = Number(trip.avg_speed_kmh).toFixed(1);
  const duration = formatDuration(Number(trip.total_duration_seconds));

  return (
    <View style={styles.tripCard}>
      {/* Top row: date + status */}
      <View style={styles.tripCardTop}>
        <View style={styles.tripDateWrap}>
          <MaterialIcons color={colors.primary} name="calendar-today" size={14} />
          <Text style={styles.tripDate}>{formatDate(trip.started_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      {/* Time range */}
      <View style={styles.timeRangeRow}>
        <View style={styles.timeChip}>
          <MaterialIcons color={colors.onSurfaceVariant} name="login" size={13} />
          <Text style={styles.timeChipText}>{formatTime(trip.started_at)}</Text>
        </View>
        <View style={styles.timeArrow}>
          <View style={styles.timeArrowLine} />
          <MaterialIcons color={colors.outlineVariant} name="arrow-forward" size={14} />
        </View>
        <View style={styles.timeChip}>
          <MaterialIcons color={colors.onSurfaceVariant} name="logout" size={13} />
          <Text style={styles.timeChipText}>
            {trip.ended_at ? formatTime(trip.ended_at) : "Ongoing"}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.tripStatsRow}>
        <TripStat icon="straighten" label="Distance" value={`${distanceKm} km`} />
        <TripStat icon="timer" label="Duration" value={duration} />
        <TripStat icon="speed" label="Avg Speed" value={`${avgSpeed} km/h`} />
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStat({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <MaterialIcons color={colors.onPrimary} name={icon} size={16} />
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

function TripStat({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.tripStat}>
      <MaterialIcons color={colors.primary} name={icon} size={14} />
      <Text style={styles.tripStatValue}>{value}</Text>
      <Text style={styles.tripStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 140, gap: 12 },

  // Header
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  pageTitle: { color: colors.indigo900, fontSize: 32, fontWeight: "900", letterSpacing: -0.6 },
  regionPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.primaryFixed, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  regionText: { color: colors.primary, fontSize: 12, fontWeight: "700" },

  // Summary card
  summaryCard: {
    backgroundColor: colors.primary, borderRadius: 18,
    padding: 18, gap: 14,
  },
  summaryName: { color: colors.onPrimary, fontSize: 17, fontWeight: "800" },
  summaryStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryStat: { flex: 1, alignItems: "center", gap: 4 },
  summaryStatValue: { color: colors.onPrimary, fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  summaryStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },

  // List header
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  totalCount: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: "700" },

  // States
  centerWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  loadingText: { color: colors.onSurfaceVariant, fontSize: 13, fontWeight: "600" },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "800" },
  emptySubtitle: { color: colors.onSurfaceVariant, fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 24 },
  retryBtn: {
    marginTop: 4, backgroundColor: colors.primary, borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 9,
  },
  retryBtnText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },

  // Trip card
  tripCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: colors.outlineVariant,
  },
  tripCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tripDateWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  tripDate: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  // Time range
  timeRangeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  timeChipText: { color: colors.onSurface, fontSize: 12, fontWeight: "700" },
  timeArrow: { flex: 1, flexDirection: "row", alignItems: "center" },
  timeArrowLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },

  // Trip stats
  tripStatsRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12, padding: 12,
  },
  tripStat: { flex: 1, alignItems: "center", gap: 3 },
  tripStatValue: { color: colors.onSurface, fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },
  tripStatLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});
