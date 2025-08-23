// Utility functions for consistent IST (Indian Standard Time) handling across the app

import { OPTIMAL_POSTING_TIMES } from './timing';

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
 * Convert any date to IST for calculations (consistent between server/client)
 */
export function toIST(date: Date): Date {
  // More reliable IST conversion - direct UTC + 5.5 hours
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime;
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
 * Format date for display in IST (client-safe to avoid hydration issues)
 */
export function formatDateIST(date: Date): string {
  // Use a consistent format that works the same on server and client
  if (typeof window === 'undefined') {
    // Server-side: Use UTC offset calculation for consistency
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 3600000)); // IST is UTC+5:30
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${istTime.getDate()} ${months[istTime.getMonth()]} ${istTime.getFullYear()}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } else {
    // Client-side: Use locale string with timezone
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
}

/**
 * Format date for datetime-local input in IST
 */
export function formatDateTimeLocalIST(date: Date): string {
  // Use the browser's built-in timezone conversion to IST
  // This properly handles UTC dates that need to be displayed in IST
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
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
 * Get next optimal posting time in IST (returns actual IST time for display)
 */
export function getNextOptimalPostingTimeIST(fromDate?: Date): Date {
  const now = fromDate ? toIST(fromDate) : toIST(new Date());
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Find next optimal time slot today
  for (const slot of OPTIMAL_POSTING_TIMES) {
    const slotTimeInMinutes = slot.hour * 60 + slot.minute;
    if (slotTimeInMinutes > currentTimeInMinutes + 5) { // 5 minute buffer
      // Found next slot today - return IST time directly
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                     slot.hour, slot.minute, 0, 0);
    }
  }
  
  // No more slots today, use first slot tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const firstSlot = OPTIMAL_POSTING_TIMES[0];
  return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                 firstSlot.hour, firstSlot.minute, 0, 0);
}

/**
 * Get next scheduled time in IST (legacy function for compatibility)
 */
export function getNextScheduledTimeIST(fromDate?: Date): Date {
  return getNextOptimalPostingTimeIST(fromDate);
}

/**
 * Format exact time for next post display (more precise)
 */
export function formatExactTimeIST(date: Date): string {
  if (typeof window === 'undefined') {
    // Server-side: Use UTC offset calculation for consistency
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 3600000)); // IST is UTC+5:30
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[istTime.getDay()];
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${dayName}, ${istTime.getDate()} ${months[istTime.getMonth()]}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } else {
    // Client-side: Use locale string with timezone
    return date.toLocaleString('en-IN', {
      timeZone: IST_TIMEZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

/**
 * Format IST time directly (for times already in IST)
 */
export function formatISTTimeDirect(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${dayName}, ${date.getDate()} ${months[date.getMonth()]}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
 * Log with IST timestamp
 */
export function logIST(message: string, ...args: unknown[]): void {
  const timestamp = getCurrentISTString();
  console.log(`[${timestamp} IST] ${message}`, ...args);
}