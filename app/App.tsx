import { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { BottomTabKey } from "./src/components/BottomNav";
import { FieldOpsProvider } from "./src/context/FieldOpsContext";
import { useFieldOps } from "./src/hooks/useFieldOps";
import { ClaimsScreen } from "./src/screens/ClaimsScreen";
import { DailyClaimDetailScreen } from "./src/screens/DailyClaimDetailScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { TripDetailsScreen } from "./src/screens/TripDetailsScreen";

export default function App() {
  return (
    <FieldOpsProvider>
      <MainApp />
    </FieldOpsProvider>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<BottomTabKey>("dashboard");
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const {
    alerts,
    claims,
    currentLocation,
    elapsedSeconds,
    endTrip,
    isAuthenticated,
    isInitializing,
    login,
    logout,
    network,
    path,
    pauseTrip,
    pendingClaimAmountInr,
    primaryActionLabel,
    resumeTrip,
    startTrip,
    todayDistanceKm,
    tripStatus,
    user,
    weeklyCompliance,
    gpsPointsCount
  } = useFieldOps();

  const handlePrimaryAction = async () => {
    if (tripStatus === "active") {
      pauseTrip();
      return;
    }

    if (tripStatus === "paused") {
      resumeTrip();
      return;
    }

    await startTrip();
  };

  // Show loading splash while checking for stored session
  if (isInitializing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" }}>
        <ActivityIndicator size="large" color="#1e37a2" />
        <Text style={{ marginTop: 16, color: "#454652", fontSize: 14, fontWeight: "600" }}>Loading FieldOps...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  switch (activeTab) {
    case "dashboard":
      return (
        <DashboardScreen
          alerts={alerts}
          currentLocation={currentLocation}
          elapsedSeconds={elapsedSeconds}
          employeeName={user.name}
          gpsPointsCount={gpsPointsCount}
          network={network}
          onEndTrip={endTrip}
          onPrimaryAction={handlePrimaryAction}
          onSelectTab={setActiveTab}
          path={path}
          pendingActions={user.pendingActions}
          pendingClaimAmountInr={pendingClaimAmountInr}
          primaryActionLabel={primaryActionLabel}
          region={user.region}
          tasks={user.tasks}
          todayDistanceKm={todayDistanceKm}
          tripStatus={tripStatus}
          weeklyCompliance={weeklyCompliance}
        />
      );
    case "trips":
      return (
        <TripDetailsScreen
          employeeName={user.name}
          onSelectTab={setActiveTab}
          region={user.region}
        />
      );
    case "claims":
      if (selectedBundleId) {
        return (
          <DailyClaimDetailScreen
            bundleId={selectedBundleId}
            onBack={() => setSelectedBundleId(null)}
            onSelectTab={(tab) => { setSelectedBundleId(null); setActiveTab(tab); }}
          />
        );
      }
      return (
        <ClaimsScreen
          onOpenBundle={(id) => setSelectedBundleId(id)}
          onSelectTab={setActiveTab}
        />
      );
    case "profile":
      return (
        <ProfileScreen
          employeeId={user.employeeId}
          employeeName={user.name}
          onLogout={logout}
          onSelectTab={setActiveTab}
          region={user.region}
          roleTitle={user.title}
        />
      );
    default:
      return (
        <DashboardScreen
          alerts={alerts}
          currentLocation={currentLocation}
          elapsedSeconds={elapsedSeconds}
          employeeName={user.name}
          gpsPointsCount={gpsPointsCount}
          network={network}
          onEndTrip={endTrip}
          onPrimaryAction={handlePrimaryAction}
          onSelectTab={setActiveTab}
          path={path}
          pendingActions={user.pendingActions}
          pendingClaimAmountInr={pendingClaimAmountInr}
          primaryActionLabel={primaryActionLabel}
          region={user.region}
          tasks={user.tasks}
          todayDistanceKm={todayDistanceKm}
          tripStatus={tripStatus}
          weeklyCompliance={weeklyCompliance}
        />
      );
  }
}
