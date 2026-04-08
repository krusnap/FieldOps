import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { colors } from "../theme/colors";

type DashboardScreenProps = {
  onSelectTab: (tab: BottomTabKey) => void;
};

const KPI_CARDS = [
  { label: "Active Trips", value: "18", icon: "route" as const },
  { label: "Pending Claims", value: "7", icon: "receipt-long" as const },
  { label: "Field Agents", value: "24", icon: "groups" as const },
  { label: "Avg Compliance", value: "94%", icon: "verified" as const }
];

const TASKS = [
  { time: "09:30", title: "Route audit review", place: "Seattle Hub" },
  { time: "11:00", title: "Vehicle compliance sync", place: "North Dock" },
  { time: "14:15", title: "Expense policy standup", place: "HQ Room 3A" }
];

export function DashboardScreen({ onSelectTab }: DashboardScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>FIELDTRACK OPERATIONS</Text>
            <Text style={styles.pageTitle}>Dashboard</Text>
          </View>
          <Pressable style={styles.avatarButton}>
            <MaterialIcons color={colors.indigo700} name="notifications" size={22} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Good morning, Krush</Text>
          <Text style={styles.heroSub}>You have 5 actions requiring approval before noon.</Text>
          <View style={styles.heroPillWrap}>
            <View style={styles.heroPill}>
              <MaterialIcons color={colors.onPrimary} name="bolt" size={14} />
              <Text style={styles.heroPillText}>Priority Window: 10:00 - 12:00</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <QuickAction icon="add-road" label="New Trip" />
          <QuickAction icon="assignment-add" label="New Claim" />
          <QuickAction icon="group-add" label="Assign Agent" />
        </View>

        <View style={styles.kpiGrid}>
          {KPI_CARDS.map((card) => (
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
            {TASKS.map((task) => (
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

type QuickActionProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <Pressable style={styles.quickActionBtn}>
      <MaterialIcons color={colors.indigo700} name={icon} size={20} />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
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
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondaryFixed
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
  quickActionsRow: {
    flexDirection: "row",
    gap: 8
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  quickActionLabel: {
    color: colors.onSurface,
    fontSize: 11,
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
