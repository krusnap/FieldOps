import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { TripStatus } from "../../types/fieldOps";

type TripTrackingWidgetProps = {
  distanceKm: number;
  gpsPoints: number;
  status: TripStatus;
  timerLabel: string;
};

const STATUS_TONE: Record<TripStatus, string> = {
  idle: "Idle",
  active: "Active",
  paused: "Paused",
  completed: "Completed"
};

export const TripTrackingWidget = memo(function TripTrackingWidget({
  distanceKm,
  gpsPoints,
  status,
  timerLabel
}: TripTrackingWidgetProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.statusPill}>
          <MaterialIcons color={colors.onPrimary} name="my-location" size={14} />
          <Text style={styles.statusText}>{STATUS_TONE[status]}</Text>
        </View>
        <Text style={styles.timer}>{timerLabel}</Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Distance" value={`${distanceKm.toFixed(2)} km`} />
        <Metric label="GPS Points" value={String(gpsPoints)} />
        <Metric label="Trip" value={STATUS_TONE[status]} />
      </View>
    </View>
  );
});

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#1e2a6f",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  timer: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3
  },
  metricValue: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "800"
  },
  metricLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600"
  }
});
