import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { colors } from "../theme/colors";

type ClaimsScreenProps = {
  onSelectTab: (tab: BottomTabKey) => void;
};

const CLAIMS = [
  { id: "CLM-1029", category: "Fuel", amount: "$84.20", status: "Approved" },
  { id: "CLM-1031", category: "Parking", amount: "$18.00", status: "Review" },
  { id: "CLM-1038", category: "Toll", amount: "$11.75", status: "Submitted" }
];

export function ClaimsScreen({ onSelectTab }: ClaimsScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>EXPENSE CENTER</Text>
        <Text style={styles.pageTitle}>Claims</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Approval</Text>
          <Text style={styles.summaryValue}>$246.40</Text>
          <Pressable style={styles.primaryBtn}>
            <MaterialIcons color={colors.onPrimary} name="add" size={18} />
            <Text style={styles.primaryBtnText}>New Claim</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Recent Claims</Text>
          <View style={styles.claimWrap}>
            {CLAIMS.map((claim) => (
              <Pressable key={claim.id} style={styles.claimRow}>
                <View style={styles.claimIconWrap}>
                  <MaterialIcons color={colors.primary} name="receipt-long" size={18} />
                </View>
                <View style={styles.claimTextWrap}>
                  <Text style={styles.claimTitle}>{claim.id}</Text>
                  <Text style={styles.claimMeta}>{claim.category}</Text>
                </View>
                <View style={styles.claimRight}>
                  <Text style={styles.claimAmount}>{claim.amount}</Text>
                  <Text style={styles.claimStatus}>{claim.status}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav activeTab="claims" onSelectTab={onSelectTab} />
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
  summaryCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  summaryLabel: {
    color: colors.onPrimaryContainer,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  summaryValue: {
    color: colors.onPrimary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.7
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800"
  },
  listCard: {
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
  claimWrap: {
    gap: 10
  },
  claimRow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  claimIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryFixed
  },
  claimTextWrap: {
    flex: 1
  },
  claimTitle: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "800"
  },
  claimMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 1
  },
  claimRight: {
    alignItems: "flex-end"
  },
  claimAmount: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "800"
  },
  claimStatus: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  }
});
