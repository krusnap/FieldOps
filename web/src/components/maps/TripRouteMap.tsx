interface TripRouteMapProps {
  origin: string;
  destination: string;
}

export default function TripRouteMap({ origin, destination }: TripRouteMapProps) {
  return (
    <div className="map-placeholder">
      <div className="map-grid" />
      <div className="map-content">
        <h4>Route Map</h4>
        <p>
          {origin} {'->'} {destination}
        </p>
      </div>
    </div>
  );
}
