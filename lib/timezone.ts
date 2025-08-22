// Utility functions for consistent IST (Indian Standard Time) handling across the app

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date and time in IST
 */
export function getCurrentIST(): Date {
  return new Date();
}

/**
 * Get current date and time formatted for IST display
 */
export function getCurrentISTString(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Convert any date to IST for calculations
 */
export function toIST(date: Date): Date {
  return new Date(date.toLocaleString("en-US", {timeZone: IST_TIMEZONE}));
}

/**
 * Get hours and minutes in IST from a date
 */
export function getISTHoursMinutes(date: Date): { hours: number; minutes: number } {
  const istDate = toIST(date);
  return {
    hours: istDate.getHours(),
    minutes: istDate.getMinutes()
  };
}

/**
 * Get day of week in IST (0 = Sunday, 1 = Monday, etc.)
 */
export function getISTDayOfWeek(date: Date): number {
  const istDate = toIST(date);
  return istDate.getDay();
}

/**
 * Create a new Date object with IST time components
 */
export function createISTDate(year?: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number): Date {
  const now = toIST(new Date());
  return new Date(
    year ?? now.getFullYear(),
    month ?? now.getMonth(),
    day ?? now.getDate(),
    hours ?? now.getHours(),
    minutes ?? now.getMinutes(),
    seconds ?? now.getSeconds()
  );
}

/**
 * Format date for display in IST
 */
export function formatDateIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for datetime-local input in IST
 */
export function formatDateTimeLocalIST(date: Date): string {
  const istDate = toIST(date);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get next scheduled time in IST
 */
export function getNextScheduledTimeIST(fromDate?: Date): Date {
  const base = fromDate ? toIST(fromDate) : toIST(new Date());
  // Add 2 hours as default scheduling time
  const nextTime = new Date(base.getTime() + 2 * 60 * 60 * 1000);
  return nextTime;
}

/**
 * Log with IST timestamp
 */
export function logIST(message: string, ...args: unknown[]): void {
  const timestamp = getCurrentISTString();
  console.log(`[${timestamp} IST] ${message}`, ...args);
}