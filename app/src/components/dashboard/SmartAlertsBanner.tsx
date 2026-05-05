import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

type SmartAlertsBannerProps = {
  alerts: {
    gpsDisabled: boolean;
    lowBattery: boolean;
    offline: boolean;
    outsideGeofence: boolean;
  };
};

export const SmartAlertsBanner = memo(function SmartAlertsBanner({ alerts }: SmartAlertsBannerProps) {
  const items = [
    alerts.outsideGeofence ? "Outside assigned geofence" : null,
    alerts.offline ? "Offline mode: data queued for sync" : null,
    alerts.gpsDisabled ? "GPS unavailable or permission denied" : null,
    alerts.lowBattery ? "Low battery warning" : null
  ].filter(Boolean) as string[];

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item} style={styles.banner}>
          <MaterialIcons color={colors.error} name="warning-amber" size={16} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 8
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  text: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "700"
  }
});
