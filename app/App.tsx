import { useState } from "react";
import { BottomTabKey } from "./src/components/BottomNav";
import { ClaimsScreen } from "./src/screens/ClaimsScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { TrackingScreen } from "./src/screens/TrackingScreen";
import { TripDetailsScreen } from "./src/screens/TripDetailsScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<BottomTabKey>("dashboard");

  switch (activeTab) {
    case "dashboard":
      return <DashboardScreen onSelectTab={setActiveTab} />;
    case "tracking":
      return <TrackingScreen onSelectTab={setActiveTab} />;
    case "trips":
      return <TripDetailsScreen onSelectTab={setActiveTab} />;
    case "claims":
      return <ClaimsScreen onSelectTab={setActiveTab} />;
    case "profile":
      return <ProfileScreen onSelectTab={setActiveTab} />;
    default:
      return <DashboardScreen onSelectTab={setActiveTab} />;
  }
}
