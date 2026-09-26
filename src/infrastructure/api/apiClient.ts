/**
 * API Client for the SHYFTEX backend.
 *
 * Handles JWT auth, token refresh, error handling, and all backend communication.
 * Uses expo-secure-store for persistent token storage.
 */

import * as SecureStore from 'expo-secure-store';
import type { RawPlanResult } from './planAdapter';

// ─── Configuration ───
//
// Set EXPO_PUBLIC_API_URL in your .env file:
//   Development:  http://localhost:4000
//   Production:   https://shyftex-api.onrender.com  (or your actual deployed URL)
//
// The URL is bundled at build time by Expo.

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'shyftex_token';
const REFRESH_KEY = 'shyftex_refresh_token';
const USER_KEY = 'shyftex_user';

// ─── Token Management ───

export const tokenStore = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async getUser(): Promise<StoredUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: StoredUser): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

// ─── Error Types ───

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── API Client ───

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Attach JWT if available
  if (!skipAuth) {
    const token = await tokenStore.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar al servidor');
  }

  // Try to parse response
  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(response.status, 'PARSE_ERROR', 'Respuesta inválida del servidor');
  }

  // Check for API error format: { success: false, error: { code, message, details } }
  if (!response.ok || json.success === false) {
    const errorData = json.error as { code?: string; message?: string; details?: unknown[] } | undefined;
    throw new ApiError(
      response.status,
      errorData?.code ?? 'API_ERROR',
      errorData?.message ?? 'Error del servidor',
      errorData?.details,
    );
  }

  // Unwrap: { success: true, data: T }
  return (json as { data: T }).data;
}

// ─── Token Refresh ───

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const result = await apiClient<{ token: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      {
        method: 'POST',
        body: { refreshToken },
        skipAuth: true,
      },
    );
    await tokenStore.setToken(result.token);
    await tokenStore.setRefreshToken(result.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Authenticated Fetch (with auto-refresh) ───

export async function authedApi<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await apiClient<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiClient<T>(path, options);
      }
      // Token is dead — clear everything
      await tokenStore.clearAll();
      throw new ApiError(401, 'SESSION_EXPIRED', 'Sesión expirada. Inicia sesión de nuevo.');
    }
    throw err;
  }
}

// ─── Typed API Methods ───

export interface AuthResponse {
  user: StoredUser;
  token: string;
  refreshToken: string;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface BackendList {
  id: string;
  userId: string;
  title: string;
  rawInput: string;
  status: string;
  itemCount: number;
  parsedItemCount: number;
  isRecurring: boolean;
  recurringInterval: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendListItem {
  id: string;
  listId: string;
  rawInput: string;
  normalizedName: string | null;
  category: string | null;
  brand: string | null;
  presentation: string | null;
  quantity: number;
  unit: string;
  size: string | null;
  barcode: string | null;
  exactProductId: string | null;
  allowsSubstitution: boolean;
  brandRestrictions: string[];
  substituteProductIds: string[];
  priority: string;
  isRequired: boolean;
  notes: string;
  matchedProductId: string | null;
  matchLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendStore {
  id: string;
  name: string;
  retailer: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  hours: string | null;
  services: string[];
  distanceFromOrigin?: number;
}

export interface BackendParseResult {
  list: BackendList;
  items: BackendListItem[];
  stats: { total: number; parsed: number; withBrand: number; withCategory: number };
}

export interface BackendMission {
  id: string;
  planId: string;
  listId: string;
  userId: string;
  status: string;
  currentStopIndex: number;
  startedAt: string | null;
  completedAt: string | null;
  totalSpentCents: number | null;
  totalSavedCents: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BackendMissionItem[];
}

export interface BackendMissionItem {
  id: string;
  missionId: string;
  storeId: string;
  productId: string | null;
  productName: string;
  expectedPriceCents: number;
  actualPriceCents: number | null;
  quantity: number;
  status: string;
  substitutionProductId: string | null;
  notes: string;
  foundAt: string | null;
}

export interface BackendVehicle {
  id: string;
  userId: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuelType: string;
  customEfficiencyKmPerLiter: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface BackendPreferences {
  id: string;
  userId: string;
  optimizationMode: string;
  maxBudgetCents: number | null;
  maxStores: number;
  preferredRetailerIds: string[];
  excludedRetailerIds: string[];
  acceptedCardBrands: string[];
  hasMembership: boolean;
  fuelType: string;
  valueOfTimePerHour: number | null;
  currency: string;
  language: string;
}

export interface BackendSubscription {
  id: string;
  userId: string;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  optimizationsUsed: number;
  optimizationsLimit: number;
  status: string;
  createdAt: string;
}

// ─── API Endpoints ───

export const authApi = {
  register(email: string, password: string, name: string) {
    return apiClient<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, name },
      skipAuth: true,
    });
  },

  login(email: string, password: string) {
    return apiClient<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
  },

  me() {
    return authedApi<BackendUser>('/api/v1/auth/me');
  },
};

export const listsApi = {
  getAll() {
    return authedApi<BackendList[]>('/api/v1/lists');
  },

  create(title: string, rawInput: string) {
    return authedApi<BackendList>('/api/v1/lists', {
      method: 'POST',
      body: { title, rawInput },
    });
  },

  get(id: string) {
    return authedApi<BackendList & { items: BackendListItem[] }>(`/api/v1/lists/${id}`);
  },

  delete(id: string) {
    return authedApi<{ deleted: boolean }>(`/api/v1/lists/${id}`, { method: 'DELETE' });
  },

  parse(id: string) {
    return authedApi<BackendParseResult>(`/api/v1/lists/${id}/parse`, { method: 'POST' });
  },
};

export const storesApi = {
  nearby(lat: number, lng: number, radius = 25) {
    return authedApi<BackendStore[]>(
      `/api/v1/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    );
  },

  get(id: string) {
    return authedApi<BackendStore>(`/api/v1/stores/${id}`);
  },
};

export const optimizeApi = {
  /**
   * Runs the optimization. The raw payload is returned untouched — use
   * `toShoppingPlan` from `./planAdapter` to get a domain entity, which
   * normalizes the backend's pesos-based wire format into integer cents.
   */
  run(listId: string, mode: string, userLocation?: { latitude: number; longitude: number }) {
    return authedApi<RawPlanResult>('/api/v1/optimize', {
      method: 'POST',
      body: { listId, mode, userLocation },
    });
  },
};

export const missionsApi = {
  getAll() {
    return authedApi<BackendMission[]>('/api/v1/missions');
  },

  create(planId: string, listId: string) {
    return authedApi<BackendMission>('/api/v1/missions', {
      method: 'POST',
      body: { planId, listId },
    });
  },

  get(id: string) {
    return authedApi<BackendMission>(`/api/v1/missions/${id}`);
  },

  updateItem(missionId: string, itemId: string, status: string, actualPriceCents?: number) {
    return authedApi<{ item: BackendMissionItem; mission: BackendMission }>(
      `/api/v1/missions/${missionId}/items/${itemId}`,
      {
        method: 'PUT',
        body: { status, actualPriceCents },
      },
    );
  },

  complete(id: string) {
    return authedApi<{ mission: BackendMission; savings: unknown }>(
      `/api/v1/missions/${id}/complete`,
      { method: 'POST' },
    );
  },
};

export const vehiclesApi = {
  getAll() {
    return authedApi<BackendVehicle[]>('/api/v1/vehicles');
  },

  create(data: { name: string; fuelType: string; make?: string; model?: string; year?: number }) {
    return authedApi<BackendVehicle>('/api/v1/vehicles', { method: 'POST', body: data });
  },

  update(id: string, data: Partial<BackendVehicle> & { isDefault?: boolean }) {
    return authedApi<BackendVehicle>(`/api/v1/vehicles/${id}`, { method: 'PUT', body: data });
  },

  delete(id: string) {
    return authedApi<{ deleted: boolean }>(`/api/v1/vehicles/${id}`, { method: 'DELETE' });
  },
};

export const preferencesApi = {
  get() {
    return authedApi<BackendPreferences>('/api/v1/preferences');
  },

  update(data: Partial<BackendPreferences>) {
    return authedApi<BackendPreferences>('/api/v1/preferences', { method: 'PUT', body: data });
  },
};

export const subscriptionApi = {
  get() {
    return authedApi<BackendSubscription>('/api/v1/subscription');
  },
};
