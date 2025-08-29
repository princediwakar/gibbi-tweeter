/**
 * Simplified DateTime utilities for IST timezone handling and basic formatting
 */

export const INDIAN_TZ = 'Asia/Kolkata';

/**
 * Get current time in Indian Standard Time (UTC+5:30)
 */
export function getCurrentTimeInIST(): Date {
  const now = new Date();
  // IST is UTC + 5:30 hours
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(now.getTime() + istOffset);
}

/**
 * Format date for user display
 */
export function formatForUserDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for datetime-local input
 */
export function toDateTimeLocal(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format with timezone information
 */
export function formatOptimalTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatForUserDisplay(dateObj) + ' IST';
}



