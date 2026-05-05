/**
 * Server-side Haversine distance calculation.
 * Takes an array of GPS points and returns total distance in km,
 * filtering out noise (jitter < 5m, impossible speed > 200 km/h).
 */

interface GpsPoint {
  latitude: number;
  longitude: number;
  recorded_at: string | Date;
}

interface DistanceResult {
  totalKm: number;
  avgSpeedKmh: number;
  durationSeconds: number;
  pointsUsed: number;
}

const EARTH_RADIUS_M = 6_371_000;
const MIN_SEGMENT_M = 5;       // Ignore jitter below 5 meters
const MAX_SPEED_MPS = 55;      // ~200 km/h

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDistance(points: GpsPoint[]): DistanceResult {
  if (points.length < 2) {
    return { totalKm: 0, avgSpeedKmh: 0, durationSeconds: 0, pointsUsed: points.length };
  }

  let totalMeters = 0;
  let pointsUsed = 1;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const segMeters = haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);

    const prevTime = new Date(prev.recorded_at).getTime();
    const currTime = new Date(curr.recorded_at).getTime();
    const segTimeSec = Math.max((currTime - prevTime) / 1000, 1);
    const segSpeedMps = segMeters / segTimeSec;

    // Filter noise
    if (segMeters < MIN_SEGMENT_M || segSpeedMps > MAX_SPEED_MPS) {
      continue;
    }

    totalMeters += segMeters;
    pointsUsed++;
  }

  const firstTime = new Date(points[0].recorded_at).getTime();
  const lastTime = new Date(points[points.length - 1].recorded_at).getTime();
  const durationSeconds = Math.max(Math.round((lastTime - firstTime) / 1000), 0);
  const totalKm = Math.round((totalMeters / 1000) * 1000) / 1000; // 3 decimal places
  const avgSpeedKmh =
    durationSeconds > 0
      ? Math.round(((totalKm / durationSeconds) * 3600) * 100) / 100
      : 0;

  return { totalKm, avgSpeedKmh, durationSeconds, pointsUsed };
}
