/**
 * Tests for MockMapProvider.
 * Verifies distance calculation and routing.
 */

import { MockMapProvider } from '../../infrastructure/providers/MockMapProvider';

describe('MockMapProvider', () => {
  let provider: MockMapProvider;

  beforeEach(() => {
    provider = new MockMapProvider();
  });

  describe('metadata', () => {
    it('should be marked as mock', () => {
      expect(provider.isMock).toBe(true);
      expect(provider.name).toBe('MockMapProvider');
    });
  });

  describe('getRoute', () => {
    it('should return a route between two CDMX points', async () => {
      const result = await provider.getRoute(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 19.45, longitude: -99.15 },
      );
      expect(result.distanceKm).toBeGreaterThan(0);
      expect(result.durationMinutes).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should have zero distance for same point', async () => {
      const result = await provider.getRoute(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 19.4326, longitude: -99.1332 },
      );
      expect(result.distanceKm).toBe(0);
      expect(result.durationMinutes).toBe(0);
    });
  });

  describe('getDistance', () => {
    it('should return distance between two CDMX points', async () => {
      const result = await provider.getDistance(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 19.45, longitude: -99.15 },
      );
      expect(result.distanceKm).toBeGreaterThan(0);
      expect(result.durationMinutes).toBeGreaterThan(0);
    });

    it('should return greater distance for far points', async () => {
      const close = await provider.getDistance(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 19.44, longitude: -99.14 },
      );
      const far = await provider.getDistance(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 20.0, longitude: -100.0 },
      );
      expect(far.distanceKm).toBeGreaterThan(close.distanceKm);
    });

    it('should handle same point (zero distance)', async () => {
      const result = await provider.getDistance(
        { latitude: 19.4326, longitude: -99.1332 },
        { latitude: 19.4326, longitude: -99.1332 },
      );
      expect(result.distanceKm).toBe(0);
      expect(result.durationMinutes).toBe(0);
    });
  });

  describe('getMultiStopRoute', () => {
    it('should return a route with multiple stops', async () => {
      const result = await provider.getMultiStopRoute(
        { latitude: 19.4326, longitude: -99.1332 },
        [
          { latitude: 19.45, longitude: -99.15 },
          { latitude: 19.46, longitude: -99.16 },
        ],
      );
      expect(result.distanceKm).toBeGreaterThan(0);
      expect(result.durationMinutes).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle empty stops', async () => {
      const result = await provider.getMultiStopRoute(
        { latitude: 19.4326, longitude: -99.1332 },
        [],
      );
      expect(result.distanceKm).toBe(0);
    });
  });
});
