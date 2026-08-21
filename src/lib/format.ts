/**
 * Formatting utilities.
 * All display formatting for the Shopping Optimizer app.
 */

/**
 * Format a number as MXN currency.
 * Uses Intl.NumberFormat for proper locale-aware formatting.
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Date to Spanish date string.
 * Example: "15 de enero de 2025"
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString('es-MX', options);
}

/**
 * Format distance in km with proper units.
 * Example: "3.5 km" or "800 m"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format duration in minutes to a readable string.
 * Example: "1h 30 min", "45 min", "2h"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes} min`;
}

/**
 * Format a date as relative time in Spanish.
 * Example: "Hace 2 horas", "Hace 5 minutos", "Ayer"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Hace un momento';
  }
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  }
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }
  return formatDate(date);
}
