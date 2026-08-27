/**
 * useLocation hook.
 *
 * Automatically requests and manages user location after authentication.
 * Updates the auth store with real coordinates from expo-location.
 * Falls back to CDMX defaults if permission denied.
 */

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/AppStore';
import {
  getSmartLocation,
  hasLocationPermission,
  type LocationCoords,
} from '../infrastructure/services/locationService';

export interface UseLocationReturn {
  /** Current coordinates or null if not yet loaded */
  location: LocationCoords | null;
  /** Whether location permission has been granted */
  hasPermission: boolean;
  /** Whether location is currently being fetched */
  isLoading: boolean;
  /** Error message if location fetch failed */
  error: string | null;
  /** Request location again (e.g., after permission grant) */
  refreshLocation: () => Promise<void>;
}

export function useLocation(enabled = true): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const { setLocation: setUserLocation } = useAuthStore();

  const refreshLocation = async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const granted = await hasLocationPermission();
      setHasPermission(granted);

      const coords = await getSmartLocation();
      setLocation(coords);

      // Update the auth store with real coordinates
      setUserLocation(coords);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting location';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && !initialized.current) {
      initialized.current = true;
      refreshLocation();
    }
  }, [enabled]);

  return {
    location,
    hasPermission,
    isLoading,
    error,
    refreshLocation,
  };
}
