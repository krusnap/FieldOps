import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { colors } from "../theme/colors";

type ProfileScreenProps = {
  onSelectTab: (tab: BottomTabKey) => void;
};

const SETTINGS = [
  { icon: "badge", label: "Employee Profile", value: "ID 48291" },
  { icon: "security", label: "Security", value: "2FA enabled" },
  { icon: "notifications", label: "Alerts", value: "Operational + Claims" },
  { icon: "language", label: "Region", value: "Pacific Northwest" }
];

export function ProfileScreen({ onSelectTab }: ProfileScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KR</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.name}>Krush</Text>
            <Text style={styles.role}>Regional Field Ops Manager</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <MaterialIcons color={colors.indigo700} name="edit" size={18} />
          </Pressable>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsWrap}>
            {SETTINGS.map((item) => (
              <Pressable key={item.label} style={styles.settingRow}>
                <View style={styles.settingIconWrap}>
                  <MaterialIcons color={colors.primary} name={item.icon as never} size={18} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingValue}>{item.value}</Text>
                </View>
                <MaterialIcons color={colors.outline} name="chevron-right" size={20} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.logoutBtn}>
          <MaterialIcons color={colors.error} name="logout" size={18} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <BottomNav activeTab="profile" onSelectTab={onSelectTab} />
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
  profileHero: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: "900"
  },
  heroTextWrap: {
    flex: 1
  },
  name: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: "800"
  },
  role: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondaryFixed,
    alignItems: "center",
    justifyContent: "center"
  },
  settingsCard: {
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
  settingsWrap: {
    gap: 10
  },
  settingRow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryFixed
  },
  settingTextWrap: {
    flex: 1
  },
  settingLabel: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700"
  },
  settingValue: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 1
  },
  logoutBtn: {
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  logoutText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "800"
  }
});
