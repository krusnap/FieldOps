import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BottomTabKey } from "../components/BottomNav";
import { StatCard } from "../components/StatCard";
import { TimelineItem } from "../components/TimelineItem";
import { colors } from "../theme/colors";

const MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBi3Zz9-QMgiBWsdSeM7Ioqed5BxZXeHSsHsVkGYxiSCs--LaijJhc9W3tbGMpmF6ytDm__lLXO8kU4DpsldY_3W3F0nru5ODxfublOcZXn983N682BnweHCMrXINuRDlnGkz99JY-E1CgWkQQ-N9Sp5QcxqXod507VxSEIkj42rkIMTZdGPsvaWAQ92Rao3IAAbCGgrBQVHWV5dLQKWDKMMCjgwTNzy1m9FnWWeNEcZBql0oNFSMCr-45qns0hgDUnr0FfWxmY6u6Z";

type TripDetailsScreenProps = {
  onSelectTab: (tab: BottomTabKey) => void;
};

export function TripDetailsScreen({ onSelectTab }: TripDetailsScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="arrow-back" />
          <Text style={styles.headerTitle}>Trip Details</Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton icon="share" />
          <IconButton icon="more-vert" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View style={styles.infoLeft}>
              <Text style={styles.dateText}>OCTOBER 24, 2023</Text>
              <Text style={styles.tripTitle}>Regional Site Inspection</Text>
            </View>
            <Text style={styles.badge}>COMPLETED</Text>
          </View>
          <View style={styles.locationRow}>
            <MaterialIcons color={colors.onSurfaceVariant} name="location-on" size={16} />
            <Text style={styles.locationText}>Seattle Metropolitan Area</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Image source={{ uri: MAP_IMAGE }} style={styles.mapImage} />
          <View style={styles.mapActions}>
            <MapControl icon="layers" />
            <MapControl icon="my-location" />
          </View>
          <View style={styles.routeBadge}>
            <View>
              <Text style={styles.routeLabel}>Route Length</Text>
              <Text style={styles.routeValue}>12.4 km</Text>
            </View>
            <View style={styles.separator} />
            <MaterialIcons color={colors.onPrimary} name="route" size={18} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard icon="straighten" label="Total Distance (km)" value="12.4" />
            <StatCard icon="timer" label="Total Duration" value="02:45" />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="speed" label="Avg Speed (km/h)" value="4.5" />
            <StatCard icon="terrain" label="Elevation Gain" value="184m" />
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Trip Timeline</Text>
          <View style={styles.timelineTrack} />
          <View style={styles.timelineWrap}>
            <TimelineItem
              icon="play-arrow"
              subtitle="HQ Main Entrance, Belltown"
              time="09:15 AM"
              title="Departure"
              variant="start"
            />
            <TimelineItem
              icon="location-on"
              subtitle="North Queen Anne Warehouse"
              time="10:30 AM"
              title="Site Alpha Arrival"
              variant="mid"
            />
            <TimelineItem
              icon="stop"
              subtitle="Commercial District Hub"
              time="12:00 PM"
              title="Trip End"
              variant="end"
            />
          </View>
        </View>

        <View style={styles.attachmentsWrap}>
          <AttachmentCard
            icon="receipt-long"
            subtitle="Fuel, Parking, Tolls"
            title="3 Claims Filed"
            tone="secondary"
          />
          <AttachmentCard
            icon="photo-library"
            subtitle="Site documentation"
            title="12 Photos"
            tone="tertiary"
          />
        </View>
      </ScrollView>

      <BottomNav activeTab="trips" onSelectTab={onSelectTab} />
    </SafeAreaView>
  );
}

type IconButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
};

function IconButton({ icon }: IconButtonProps) {
  return (
    <Pressable style={styles.iconBtn}>
      <MaterialIcons color={colors.indigo700} name={icon} size={22} />
    </Pressable>
  );
}

type MapControlProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
};

function MapControl({ icon }: MapControlProps) {
  return (
    <Pressable style={styles.mapControl}>
      <MaterialIcons color={colors.onSurface} name={icon} size={20} />
    </Pressable>
  );
}

type AttachmentCardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  tone: "secondary" | "tertiary";
};

function AttachmentCard({ icon, title, subtitle, tone }: AttachmentCardProps) {
  const iconWrapStyle = tone === "secondary" ? styles.secondaryIconWrap : styles.tertiaryIconWrap;
  const iconColor = tone === "secondary" ? colors.onSecondaryContainer : colors.onTertiaryFixedVariant;

  return (
    <Pressable style={styles.attachmentCard}>
      <View style={[styles.attachmentIconWrap, iconWrapStyle]}>
        <MaterialIcons color={iconColor} name={icon} size={24} />
      </View>
      <View style={styles.attachmentTextWrap}>
        <Text style={styles.attachmentTitle}>{title}</Text>
        <Text style={styles.attachmentSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons color={colors.outline} name="chevron-right" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "rgba(248,249,250,0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(197,197,212,0.3)"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.indigo900
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 140,
    gap: 16
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 18,
    gap: 10
  },
  infoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  infoLeft: {
    flexShrink: 1,
    gap: 4
  },
  dateText: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700"
  },
  tripTitle: {
    color: colors.onSurface,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6
  },
  badge: {
    backgroundColor: colors.tertiaryFixed,
    color: colors.onTertiaryFixed,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  locationText: {
    color: colors.onSurfaceVariant,
    fontSize: 13
  },
  mapContainer: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh,
    height: 210,
    position: "relative"
  },
  mapImage: {
    width: "100%",
    height: "100%"
  },
  mapActions: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 8
  },
  mapControl: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center"
  },
  routeBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(30,55,162,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  routeLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  routeValue: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "800"
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.3)"
  },
  statsGrid: {
    gap: 12
  },
  statsRow: {
    flexDirection: "row",
    gap: 12
  },
  timelineCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 18,
    position: "relative"
  },
  sectionTitle: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "800",
    marginBottom: 18
  },
  timelineTrack: {
    position: "absolute",
    left: 29,
    top: 54,
    bottom: 24,
    width: 2,
    backgroundColor: "rgba(197,197,212,0.45)"
  },
  timelineWrap: {
    gap: 24
  },
  attachmentsWrap: {
    gap: 12
  },
  attachmentCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  attachmentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryIconWrap: {
    backgroundColor: colors.secondaryContainer
  },
  tertiaryIconWrap: {
    backgroundColor: colors.tertiaryFixed
  },
  attachmentTextWrap: {
    flex: 1
  },
  attachmentTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  attachmentSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2
  },
});
