import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { colors } from "../../theme/colors";
import { LocationPoint } from "../../types/fieldOps";

type MiniMapPreviewProps = {
  currentLocation: LocationPoint | null;
  path: LocationPoint[];
};

export const MiniMapPreview = memo(function MiniMapPreview({ currentLocation, path }: MiniMapPreviewProps) {
  if (!currentLocation) {
    return (
      <View style={styles.emptyMap}>
        <Text style={styles.emptyText}>Waiting for GPS fix...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapWrap}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        } as Region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
        customMapStyle={[]}
      >
        {path.length > 0 && (
          <Polyline
            coordinates={path.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
            strokeColor="#2B6CB0"
            strokeWidth={4}
          />
        )}

        <Marker
          coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
          title="You"
        />
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    height: 178
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fallbackMapCanvas: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    gap: 4
  },
  fallbackTitle: {
    color: colors.indigo900,
    fontSize: 13,
    fontWeight: "900"
  },
  fallbackText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700"
  },
  emptyMap: {
    height: 178,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700"
  }
});
