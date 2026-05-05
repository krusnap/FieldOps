import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { TripStatus } from "../../types/fieldOps";

type SmartPrimaryActionButtonProps = {
  onEndTrip: () => void;
  onPrimaryAction: () => void;
  primaryLabel: "Start Trip" | "Pause Trip" | "Resume Trip";
  status: TripStatus;
};

const LABEL_ICON: Record<SmartPrimaryActionButtonProps["primaryLabel"], keyof typeof MaterialIcons.glyphMap> = {
  "Start Trip": "play-arrow",
  "Pause Trip": "pause",
  "Resume Trip": "play-arrow"
};

export const SmartPrimaryActionButton = memo(function SmartPrimaryActionButton({
  onEndTrip,
  onPrimaryAction,
  primaryLabel,
  status
}: SmartPrimaryActionButtonProps) {
  return (
    <Animated.View style={styles.wrap}>
      <Pressable onPress={onPrimaryAction} style={styles.primaryBtn}>
        <MaterialIcons color={colors.onPrimary} name={LABEL_ICON[primaryLabel]} size={20} />
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>

      {status === "active" && (
        <View style={styles.helperRow}>
          <Text style={styles.helperText}>Trip is live.</Text>
          <Pressable onPress={onEndTrip} style={styles.endBtn}>
            <MaterialIcons color={colors.error} name="stop" size={16} />
            <Text style={styles.endText}>End Trip</Text>
          </Pressable>
        </View>
      )}

      {status === "paused" && (
        <View style={styles.helperRow}>
          <Text style={styles.helperText}>Tracking paused. Resume to continue collecting GPS points.</Text>
          <Pressable onPress={onEndTrip} style={styles.endBtn}>
            <MaterialIcons color={colors.error} name="stop" size={16} />
            <Text style={styles.endText}>End Trip</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 8
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "900"
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  helperText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
    marginRight: 8
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.errorContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  endText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: "800"
  }
});
