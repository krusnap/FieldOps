interface RouteMapPlaceholderProps {
  title?: string;
  origin: string;
  destination: string;
}

export default function RouteMapPlaceholder({ title = "Route Visualization", origin, destination }: RouteMapPlaceholderProps) {
  return (
    <div className="map-placeholder">
      <div className="map-grid" />
      <div className="map-content">
        <h4>{title}</h4>
        <p>
          {origin} {"->"} {destination}
        </p>
      </div>
    </div>
  );
}
