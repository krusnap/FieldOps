import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { colors } from "../theme/colors";

type TrackingScreenProps = {
  onSelectTab: (tab: BottomTabKey) => void;
};

const AGENTS = [
  { name: "Mia Chen", zone: "Downtown Loop", status: "On route", eta: "12 min" },
  { name: "Owen Patel", zone: "North Ridge", status: "At checkpoint", eta: "Now" },
  { name: "Lina Scott", zone: "Industrial Belt", status: "Idle", eta: "35 min" }
];

export function TrackingScreen({ onSelectTab }: TrackingScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>LIVE MONITORING</Text>
        <Text style={styles.pageTitle}>Tracking</Text>

        <View style={styles.mapMock}>
          <View style={styles.mapTopRow}>
            <Pill icon="public" label="Seattle Region" />
            <Pill icon="my-location" label="Realtime" />
          </View>
          <View style={styles.mapCenter}>
            <MaterialIcons color={colors.primary} name="explore" size={38} />
            <Text style={styles.mapLabel}>Live fleet map</Text>
          </View>
          <View style={styles.mapBottomRow}>
            <Text style={styles.mapBottomLabel}>Agents online: 24</Text>
            <Text style={styles.mapBottomLabel}>Routes active: 18</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Agent Activity</Text>
          <View style={styles.agentWrap}>
            {AGENTS.map((agent) => (
              <Pressable key={agent.name} style={styles.agentRow}>
                <View style={styles.avatarDot} />
                <View style={styles.agentTextWrap}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentMeta}>
                    {agent.zone} • {agent.status}
                  </Text>
                </View>
                <Text style={styles.agentEta}>{agent.eta}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav activeTab="tracking" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

type PillProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

function Pill({ icon, label }: PillProps) {
  return (
    <View style={styles.pill}>
      <MaterialIcons color={colors.onSecondaryFixed} name={icon} size={14} />
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
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
  mapMock: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  mapTopRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  mapCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  mapLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "700"
  },
  mapBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  mapBottomLabel: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: "700"
  },
  pill: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  pillLabel: {
    color: colors.onSecondaryFixed,
    fontSize: 11,
    fontWeight: "700"
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
  agentWrap: {
    gap: 10
  },
  agentRow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.tertiaryFixedDim
  },
  agentTextWrap: {
    flex: 1
  },
  agentName: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700"
  },
  agentMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2
  },
  agentEta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  }
});
