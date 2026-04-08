import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type StatCardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
};

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <MaterialIcons color={colors.primary} name={icon} size={24} />
      <View style={styles.textWrap}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    flex: 1,
    minHeight: 128
  },
  textWrap: {
    gap: 6
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
    fontWeight: "600"
  }
});
