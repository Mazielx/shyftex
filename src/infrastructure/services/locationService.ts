/**
 * Location Service — wraps expo-location with permission handling,
 * caching, and fallback to CDMX default.
 */

import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

const CDMX_DEFAULT: LocationCoords = { latitude: 19.4326, longitude: -99.1332 };

const LOCATION_CACHE_KEY = 'shyftex_last_location';
const LOCATION_CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface CachedLocation {
  coords: LocationCoords;
  timestamp: number;
}

/**
 * Request location permission and get current position.
 * Returns null if permission denied or location unavailable.
 */
export async function requestAndGetLocation(): Promise<LocationCoords | null> {
  try {
    // Check existing permission
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[LocationService] Permission denied, using fallback');
      return null;
    }

    // Get current position with timeout
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords: LocationCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Cache the location
    try {
      const cached: CachedLocation = { coords, timestamp: Date.now() };
      // Use AsyncStorage-like approach — we'll use a simple module-level cache
      lastLocation = cached;
    } catch {
      // Caching is best-effort
    }

    return coords;
  } catch (err) {
    console.warn('[LocationService] Failed to get location:', err);
    return null;
  }
}

/**
 * Get cached location if still fresh, otherwise request a new one.
 * Falls back to CDMX default coordinates if everything fails.
 */
export async function getSmartLocation(): Promise<LocationCoords> {
  // Check in-memory cache first
  if (lastLocation && Date.now() - lastLocation.timestamp < LOCATION_CACHE_MAX_AGE_MS) {
    return lastLocation.coords;
  }

  // Try to get fresh location
  const freshLocation = await requestAndGetLocation();
  if (freshLocation) {
    return freshLocation;
  }

  // Fall back to last cached location
  if (lastLocation) {
    return lastLocation.coords;
  }

  // Ultimate fallback: CDMX center
  return CDMX_DEFAULT;
}

/**
 * Check if location permission is granted.
 */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Calculate distance between two points in km (Haversine).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── Module-level cache ───

let lastLocation: CachedLocation | null = null;
