import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

type SyncStatusPillProps = {
  isOnline: boolean;
  isSyncing: boolean;
};

export const SyncStatusPill = memo(function SyncStatusPill({ isOnline, isSyncing }: SyncStatusPillProps) {
  const label = isSyncing ? "Syncing" : isOnline ? "Online" : "Offline";
  const icon = isSyncing ? "sync" : isOnline ? "cloud-done" : "cloud-off";
  const tone = isOnline ? colors.tertiaryFixedDim : colors.errorContainer;

  return (
    <View style={[styles.pill, { backgroundColor: tone }]}>
      <MaterialIcons color={colors.onSecondaryFixed} name={icon} size={14} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center"
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSecondaryFixed
  }
});
