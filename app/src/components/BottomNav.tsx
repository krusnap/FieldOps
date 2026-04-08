import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type BottomTabKey = "dashboard" | "tracking" | "trips" | "claims" | "profile";

type BottomNavProps = {
  activeTab: BottomTabKey;
  onSelectTab: (tab: BottomTabKey) => void;
};

type NavItem = {
  key: BottomTabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "tracking", label: "Tracking", icon: "explore" },
  { key: "trips", label: "Trips", icon: "route" },
  { key: "claims", label: "Claims", icon: "receipt-long" },
  { key: "profile", label: "Profile", icon: "person" }
];

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {ITEMS.map((item) => {
        const active = item.key === activeTab;

        return (
          <Pressable
            key={item.key}
            onPress={() => onSelectTab(item.key)}
            style={[styles.navItem, active ? styles.navItemActive : undefined]}
          >
            <MaterialIcons
              color={active ? colors.indigo700 : colors.slate400}
              name={item.icon}
              size={22}
            />
            <Text style={[styles.navLabel, active ? styles.navLabelActive : undefined]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 28
  },
  navItem: {
    width: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6
  },
  navItemActive: {
    backgroundColor: colors.indigo100
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.slate400
  },
  navLabelActive: {
    color: colors.indigo700
  }
});
