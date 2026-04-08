import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type TimelineItemProps = {
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  variant: "start" | "mid" | "end";
};

export function TimelineItem({ title, subtitle, time, icon, variant }: TimelineItemProps) {
  const markerStyle =
    variant === "start"
      ? styles.startMarker
      : variant === "end"
        ? styles.endMarker
        : styles.midMarker;

  const timeStyle = variant === "mid" ? styles.timeMuted : styles.timePrimary;

  return (
    <View style={styles.row}>
      <View style={[styles.marker, markerStyle]}>
        <MaterialIcons
          color={variant === "start" || variant === "end" ? colors.onPrimary : colors.primary}
          name={icon}
          size={12}
        />
      </View>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.time, timeStyle]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center"
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3
  },
  startMarker: {
    backgroundColor: colors.primary
  },
  midMarker: {
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.primaryFixedDim
  },
  endMarker: {
    backgroundColor: colors.onSurface
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  title: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12
  },
  time: {
    fontSize: 14,
    fontWeight: "800"
  },
  timePrimary: {
    color: colors.primary
  },
  timeMuted: {
    color: colors.onSurfaceVariant
  }
});
