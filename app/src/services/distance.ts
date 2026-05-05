import { LocationPoint } from "../types/fieldOps";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(start: LocationPoint, end: LocationPoint): number {
  const dLat = toRadians(end.latitude - start.latitude);
  const dLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function shouldIgnoreLocationPoint(previous: LocationPoint, current: LocationPoint): boolean {
  const distance = haversineDistanceMeters(previous, current);
  const timeDiffSeconds = Math.max(1, (current.timestamp - previous.timestamp) / 1000);
  const speedMetersPerSecond = distance / timeDiffSeconds;
  const hasPoorAccuracy = (current.accuracy ?? 999) > 90;

  if (hasPoorAccuracy) {
    return true;
  }

  // Ignore jitter and unrealistic jumps.
  if (distance < 8 || speedMetersPerSecond > 45) {
    return true;
  }

  return false;
}

export function isOutsideGeofence(
  point: LocationPoint,
  center: { latitude: number; longitude: number },
  radiusMeters: number
): boolean {
  return (
    haversineDistanceMeters(point, {
      latitude: center.latitude,
      longitude: center.longitude,
      timestamp: point.timestamp
    }) > radiusMeters
  );
}
