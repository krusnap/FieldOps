import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { MiniMapPreview } from "../components/dashboard/MiniMapPreview";
import { SmartAlertsBanner } from "../components/dashboard/SmartAlertsBanner";
import { SmartPrimaryActionButton } from "../components/dashboard/SmartPrimaryActionButton";
import { SyncStatusPill } from "../components/dashboard/SyncStatusPill";
import { TripTrackingWidget } from "../components/dashboard/TripTrackingWidget";
import { colors } from "../theme/colors";
import { LocationPoint, TripStatus } from "../types/fieldOps";

type DashboardScreenProps = {
  alerts: {
    outsideGeofence: boolean;
    offline: boolean;
    gpsDisabled: boolean;
    lowBattery: boolean;
  };
  employeeName: string;
  elapsedSeconds: number;
  gpsPointsCount: number;
  network: {
    isOnline: boolean;
    isSyncing: boolean;
  };
  onEndTrip: () => void;
  onPrimaryAction: () => void;
  onSelectTab: (tab: BottomTabKey) => void;
  path: LocationPoint[];
  pendingActions: number;
  pendingClaimAmountInr: number;
  primaryActionLabel: "Start Trip" | "Pause Trip" | "Resume Trip";
  region: string;
  tasks: Array<{ time: string; title: string; place: string }>;
  todayDistanceKm: number;
  tripStatus: TripStatus;
  weeklyCompliance: string;
  currentLocation: LocationPoint | null;
};

const STATUS_LABEL: Record<DashboardScreenProps["tripStatus"], string> = {
  idle: "Idle",
  active: "In progress",
  paused: "Paused",
  completed: "Completed"
};

export function DashboardScreen({
  alerts,
  currentLocation,
  employeeName,
  elapsedSeconds,
  gpsPointsCount,
  network,
  onEndTrip,
  onPrimaryAction,
  onSelectTab,
  path,
  pendingActions,
  pendingClaimAmountInr,
  primaryActionLabel,
  region,
  tasks,
  todayDistanceKm,
  tripStatus,
  weeklyCompliance
}: DashboardScreenProps) {
  const timerLabel = new Date(elapsedSeconds * 1000).toISOString().slice(11, 19);

  const kpiCards: Array<{ label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
    {
      label: "Trip Status",
      value: STATUS_LABEL[tripStatus],
      icon: tripStatus === "completed" ? "check-circle" : "directions"
    },
    { label: "Today Distance", value: `${todayDistanceKm.toFixed(2)} km`, icon: "straighten" },
    { label: "Pending Claims", value: `INR ${pendingClaimAmountInr.toFixed(0)}`, icon: "receipt-long" },
    { label: "Weekly Compliance", value: weeklyCompliance, icon: "verified" }
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>FIELDTRACK OPERATIONS</Text>
            <Text style={styles.pageTitle}>Dashboard</Text>
          </View>
          <SyncStatusPill isOnline={network.isOnline} isSyncing={network.isSyncing} />
        </View>

        <TripTrackingWidget
          distanceKm={todayDistanceKm}
          gpsPoints={gpsPointsCount}
          status={tripStatus}
          timerLabel={timerLabel}
        />

        <SmartAlertsBanner alerts={alerts} />

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Good morning, {employeeName}</Text>
          <Text style={styles.heroSub}>You have {pendingActions} actions requiring your attention today.</Text>
          <View style={styles.heroPillWrap}>
            <View style={styles.heroPill}>
              <MaterialIcons color={colors.onPrimary} name="bolt" size={14} />
              <Text style={styles.heroPillText}>{region} zone • Trip: {STATUS_LABEL[tripStatus]}</Text>
            </View>
          </View>
        </View>

        <SmartPrimaryActionButton
          onEndTrip={onEndTrip}
          onPrimaryAction={onPrimaryAction}
          primaryLabel={primaryActionLabel}
          status={tripStatus}
        />

        <MiniMapPreview currentLocation={currentLocation} path={path} />

        <View style={styles.kpiGrid}>
          {kpiCards.map((card) => (
            <View key={card.label} style={styles.kpiCard}>
              <MaterialIcons color={colors.primary} name={card.icon} size={20} />
              <Text style={styles.kpiValue}>{card.value}</Text>
              <Text style={styles.kpiLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          <View style={styles.taskWrap}>
            {tasks.map((task) => (
              <View key={task.title} style={styles.taskRow}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{task.time}</Text>
                </View>
                <View style={styles.taskTextWrap}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskPlace}>{task.place}</Text>
                </View>
                <MaterialIcons color={colors.outline} name="chevron-right" size={20} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav activeTab="dashboard" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140,
    gap: 14
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  kicker: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  pageTitle: {
    color: colors.indigo900,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6
  },
  heroCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: 18,
    gap: 6
  },
  heroTitle: {
    color: colors.onPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  heroSub: {
    color: colors.onPrimaryContainer,
    fontSize: 13,
    lineHeight: 19
  },
  heroPillWrap: {
    marginTop: 8,
    flexDirection: "row"
  },
  heroPill: {
    backgroundColor: "rgba(0, 17, 89, 0.28)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  heroPillText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "700"
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  kpiCard: {
    width: "48%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    gap: 5
  },
  kpiValue: {
    color: colors.onSurface,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  kpiLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600"
  },
  sectionCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  sectionTitle: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "800"
  },
  taskWrap: {
    gap: 10
  },
  taskRow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  timeBadge: {
    minWidth: 58,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 999,
    paddingVertical: 5,
    alignItems: "center"
  },
  timeText: {
    color: colors.onSecondaryFixed,
    fontSize: 11,
    fontWeight: "800"
  },
  taskTextWrap: {
    flex: 1
  },
  taskTitle: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700"
  },
  taskPlace: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2
  }
});
