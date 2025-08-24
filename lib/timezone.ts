// Utility functions for consistent US Eastern Time handling across the app
// Focused on US student engagement times for test prep content

import { OPTIMAL_POSTING_TIMES_ET } from './datetime';

export const US_TIMEZONE = 'America/New_York'; // Eastern Time (covers EDT/EST automatically)
export const US_TIMEZONE_PST = 'America/Los_Angeles'; // Pacific Time for West Coast

/**
 * Get current date and time in US Eastern Time
 */
export function getCurrentET(): Date {
  return new Date();
}

/**
 * Get current date and time formatted for US Eastern Time display
 */
export function getCurrentETString(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: US_TIMEZONE,
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
 * Convert any date to US Eastern Time for calculations (consistent between server/client)
 */
export function toET(date: Date): Date {
  // Return the date as-is since we'll use proper timezone handling with Intl
  // This maintains compatibility while we use proper timezone conversion elsewhere
  return new Date(date);
}

/**
 * Get hours and minutes in US Eastern Time from a date
 */
export function getETHoursMinutes(date: Date): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: US_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  return {
    hours: parseInt(parts.find(part => part.type === 'hour')?.value || '0'),
    minutes: parseInt(parts.find(part => part.type === 'minute')?.value || '0')
  };
}

/**
 * Get day of week in US Eastern Time (0 = Sunday, 1 = Monday, etc.)
 */
export function getETDayOfWeek(date: Date): number {
  const etDate = new Date(date.toLocaleString('en-US', { timeZone: US_TIMEZONE }));
  return etDate.getDay();
}

/**
 * Create a new Date object with US Eastern Time components
 */
export function createETDate(year?: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number): Date {
  const now = new Date();
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: US_TIMEZONE }));
  return new Date(
    year ?? etNow.getFullYear(),
    month ?? etNow.getMonth(),
    day ?? etNow.getDate(),
    hours ?? etNow.getHours(),
    minutes ?? etNow.getMinutes(),
    seconds ?? etNow.getSeconds()
  );
}

/**
 * Format date for display in US Eastern Time (client-safe to avoid hydration issues)
 */
export function formatDateET(date: Date): string {
  // Use consistent timezone formatting for both server and client
  return date.toLocaleString('en-US', {
    timeZone: US_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for datetime-local input in US Eastern Time
 */
export function formatDateTimeLocalET(date: Date): string {
  // Use the browser's built-in timezone conversion to Eastern Time
  // This properly handles UTC dates that need to be displayed in ET
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: US_TIMEZONE,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  const hour = parts.find(part => part.type === 'hour')?.value;
  const minute = parts.find(part => part.type === 'minute')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Get next optimal posting time in US Eastern Time (returns actual ET time for display)
 */
export function getNextOptimalPostingTimeET(fromDate?: Date): Date {
  const now = fromDate || new Date();
  const etHoursMinutes = getETHoursMinutes(now);
  const currentTimeInMinutes = etHoursMinutes.hours * 60 + etHoursMinutes.minutes;
  
  // Create a date in ET timezone for today
  const etToday = new Date(now.toLocaleString('en-US', { timeZone: US_TIMEZONE }));
  
  // Find next optimal time slot today
  for (const slot of OPTIMAL_POSTING_TIMES_ET) {
    const slotTimeInMinutes = slot.hour * 60 + slot.minute;
    if (slotTimeInMinutes > currentTimeInMinutes + 5) { // 5 minute buffer
      // Found next slot today - create ET time
      const nextSlot = new Date(etToday.getFullYear(), etToday.getMonth(), etToday.getDate(), 
                               slot.hour, slot.minute, 0, 0);
      return nextSlot;
    }
  }
  
  // No more slots today, use first slot tomorrow
  const etTomorrow = new Date(etToday.getTime() + 24 * 60 * 60 * 1000);
  const firstSlot = OPTIMAL_POSTING_TIMES_ET[0];
  return new Date(etTomorrow.getFullYear(), etTomorrow.getMonth(), etTomorrow.getDate(),
                 firstSlot.hour, firstSlot.minute, 0, 0);
}

/**
 * Get next scheduled time in US Eastern Time (legacy function for compatibility)
 */
export function getNextScheduledTimeET(fromDate?: Date): Date {
  return getNextOptimalPostingTimeET(fromDate);
}

/**
 * Format exact time for next post display (more precise) in US Eastern Time
 */
export function formatExactTimeET(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: US_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' ET';
}

/**
 * Format US Eastern Time directly (for times already in ET)
 */
export function formatETTimeDirect(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${dayName}, ${date.getDate()} ${months[date.getMonth()]}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} ET`;
}

/**
 * Get time remaining until a future date (human readable)
 */
export function getTimeUntil(futureDate: Date): string {
  const now = new Date();
  const diffMs = futureDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Now';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours}h ${diffMinutes}m`;
  } else {
    return `in ${diffMinutes}m`;
  }
}

/**
 * Log with US Eastern Time timestamp
 */
export function logET(message: string, ...args: unknown[]): void {
  const timestamp = getCurrentETString();
  console.log(`[${timestamp} ET] ${message}`, ...args);
}