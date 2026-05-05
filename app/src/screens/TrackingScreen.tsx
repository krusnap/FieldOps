import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { useContext, useRef, useState } from "react";
import { FieldOpsContext } from "../context/FieldOpsContext";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { colors } from "../theme/colors";

type TrackingScreenProps = {
  checkpoints: Array<{ label: string; eta: string }>;
  employeeName: string;
  onSelectTab: (tab: BottomTabKey) => void;
  region: string;
  tripStatus: "not_started" | "in_progress" | "paused" | "completed";
};

export function TrackingScreen({ checkpoints, employeeName, onSelectTab, region, tripStatus }: TrackingScreenProps) {
  const ctx = useContext(FieldOpsContext);
  const currentLocation = ctx?.currentLocation ?? null;
  const path = ctx?.path ?? [];
  const refreshCurrentLocation = ctx?.refreshCurrentLocation ?? null;
  const mapRef = useRef<MapView | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>LIVE MONITORING</Text>
        <Text style={styles.pageTitle}>Tracking</Text>

        <View style={styles.mapMock}>
          <View style={styles.mapTopRow}>
            <Pill icon="public" label={region} />
            <Pill icon="my-location" label={tripStatus.replace("_", " ")} />
          </View>
          <View style={{ height: 220, marginTop: 8 }}>
            <MapView
              ref={(r) => { mapRef.current = r; }}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFill}
              mapType={mapType}
              showsUserLocation
              initialRegion={
                (currentLocation
                  ? {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                      latitudeDelta: 0.04,
                      longitudeDelta: 0.04,
                    }
                  : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5, longitudeDelta: 5 }) as Region
              }
            >
              {path.length > 0 && (
                <Polyline
                  coordinates={path.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
                  strokeColor="#2B6CB0"
                  strokeWidth={4}
                />
              )}

              {currentLocation && (
                <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} title={employeeName} />
              )}
            </MapView>
            <View style={styles.mapControlRow} pointerEvents="box-none">
              <Pressable
                style={styles.mapControlBtn}
                onPress={async () => {
                  const point = (currentLocation ?? (await refreshCurrentLocation?.())) ?? null;
                  if (!point || !mapRef.current) return;

                  try {
                    if ((mapRef.current as any).animateToRegion) {
                      (mapRef.current as any).animateToRegion({
                        latitude: point.latitude,
                        longitude: point.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      });
                    } else if ((mapRef.current as any).animateCamera) {
                      (mapRef.current as any).animateCamera({
                        center: { latitude: point.latitude, longitude: point.longitude },
                        zoom: 15,
                      });
                    }
                  } catch (e) {
                    console.warn("Map animate failed", e);
                  }
                }}
              >
                <MaterialIcons name="my-location" size={18} color={colors.indigo900} />
              </Pressable>
              <Pressable
                style={styles.mapControlBtn}
                onPress={() => setMapType((t) => (t === "standard" ? "satellite" : "standard"))}
              >
                <MaterialIcons name="layers" size={18} color={colors.indigo900} />
              </Pressable>
            </View>
          </View>
          <View style={styles.mapBottomRow}>
            <Text style={styles.mapBottomLabel}>Employee: {employeeName}</Text>
            <Text style={styles.mapBottomLabel}>Checkpoints: {checkpoints.length}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Checkpoints</Text>
          <View style={styles.agentWrap}>
            {checkpoints.map((checkpoint) => (
              <Pressable key={checkpoint.label} style={styles.agentRow}>
                <View style={styles.avatarDot} />
                <View style={styles.agentTextWrap}>
                  <Text style={styles.agentName}>{checkpoint.label}</Text>
                  <Text style={styles.agentMeta}>Status: {tripStatus.replace("_", " ")}</Text>
                </View>
                <Text style={styles.agentEta}>{checkpoint.eta}</Text>
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
  ,
  mapControlRow: {
    position: "absolute",
    right: 8,
    top: 8,
    flexDirection: "row",
    gap: 8,
    zIndex: 20,
    elevation: 20
  },
  mapControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center"
  }
});
