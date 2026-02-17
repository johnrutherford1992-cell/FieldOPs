// ============================================================
// Geofence Utilities — Time Tracking GPS Validation
// ============================================================

/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a GPS coordinate is within the project geofence.
 */
export function isWithinGeofence(
  workerLat: number,
  workerLng: number,
  fenceLat: number,
  fenceLng: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(workerLat, workerLng, fenceLat, fenceLng);
  return distance <= radiusMeters;
}

/**
 * Get the current GPS position from the browser.
 * Returns null if geolocation is unavailable or denied.
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Permission denied or error
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Round time to nearest increment (in minutes).
 * E.g., roundToIncrement(7:43, 15) → 7:45
 */
export function roundTimeToIncrement(date: Date, incrementMinutes: number): Date {
  const ms = incrementMinutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}
