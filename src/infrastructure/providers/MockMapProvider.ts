/**
 * Mock Map Provider.
 * Provides route and distance calculations for development.
 * ALL DATA IS MOCK - clearly marked.
 */

import {
  MapProvider,
  LatLng,
  RouteOptions,
  RouteResult,
  DistanceResult,
} from '../../domain/interfaces/providers';

export class MockMapProvider implements MapProvider {
  readonly name = 'MockMapProvider';
  readonly isMock = true;

  async getRoute(
    origin: LatLng,
    destination: LatLng,
    options?: RouteOptions,
  ): Promise<RouteResult> {
    const distance = this.calculateDistance(origin, destination);
    const duration = Math.round((distance / 30) * 60); // ~30 km/h city average

    return {
      distanceKm: Math.round(distance * 100) / 100,
      durationMinutes: duration,
      polyline: null,
      steps: [
        {
          instruction: `Head to destination`,
          distanceKm: distance,
          durationMinutes: duration,
        },
      ],
      tollCost: distance > 10 ? Math.round(distance * 2) : null,
      fuelEstimate: null,
    };
  }

  async getMultiStopRoute(
    origin: LatLng,
    stops: LatLng[],
    options?: RouteOptions,
  ): Promise<RouteResult> {
    let totalDistance = 0;
    let totalDuration = 0;
    const allSteps: RouteResult['steps'] = [];

    let current = origin;
    for (const stop of stops) {
      const segment = await this.getRoute(current, stop, options);
      totalDistance += segment.distanceKm;
      totalDuration += segment.durationMinutes;
      allSteps.push(...segment.steps);
      current = stop;
    }

    // Return trip
    const returnTrip = await this.getRoute(current, origin, options);
    totalDistance += returnTrip.distanceKm;
    totalDuration += returnTrip.durationMinutes;

    return {
      distanceKm: Math.round(totalDistance * 100) / 100,
      durationMinutes: totalDuration,
      polyline: null,
      steps: allSteps,
      tollCost: totalDistance > 10 ? Math.round(totalDistance * 2) : null,
      fuelEstimate: null,
    };
  }

  async getDistance(origin: LatLng, destination: LatLng): Promise<DistanceResult> {
    const distance = this.calculateDistance(origin, destination);
    const duration = Math.round((distance / 30) * 60);
    return {
      distanceKm: Math.round(distance * 100) / 100,
      durationMinutes: duration,
    };
  }

  private calculateDistance(a: LatLng, b: LatLng): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLon = this.toRad(b.longitude - a.longitude);
    const lat1 = this.toRad(a.latitude);
    const lat2 = this.toRad(b.latitude);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
