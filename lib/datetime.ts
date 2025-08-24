/**
 * Clean DateTime utilities with proper timezone separation:
 * - Backend business logic runs on US Eastern Time (for optimal US student engagement)
 * - Frontend UI displays times in user's local timezone (for better UX)
 */

import { format, addMinutes } from 'date-fns';
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

// Constants
export const US_EASTERN_TZ = 'America/New_York';
export const OPTIMAL_POSTING_TIMES_ET = [
  { hour: 7, minute: 30, description: 'Morning challenge - before school rush', engagement: 'high' },
  { hour: 8, minute: 45, description: 'Commute scrolling - peak viral time', engagement: 'high' },
  { hour: 10, minute: 15, description: 'Mid-morning brain break challenge', engagement: 'medium' },
  { hour: 11, minute: 45, description: 'Pre-lunch competitive content', engagement: 'high' },
  { hour: 12, minute: 15, description: 'Lunch break viral content - prime sharing', engagement: 'high' },
  { hour: 1, minute: 30, description: 'Post-lunch engagement boost', engagement: 'medium' },
  { hour: 3, minute: 0, description: 'After-school viral peak - students online', engagement: 'high' },
  { hour: 4, minute: 15, description: 'Peak student activity - homework procrastination', engagement: 'high' },
  { hour: 5, minute: 45, description: 'Dinner prep downtime - quick challenges', engagement: 'medium' },
  { hour: 7, minute: 15, description: 'Prime study break - high engagement', engagement: 'high' },
  { hour: 8, minute: 30, description: 'Evening social media peak - maximum viral potential', engagement: 'high' },
  { hour: 9, minute: 45, description: 'Night study session - concentration challenges', engagement: 'high' },
  { hour: 10, minute: 30, description: 'Late night grind - dedicated students online', engagement: 'medium' },
  { hour: 11, minute: 15, description: 'Night owl study time - final challenge of day', engagement: 'medium' },
] as const;

export const US_STUDENT_WEEKDAY_MULTIPLIERS = {
  0: 1.3, // Sunday - peak anxiety about upcoming week, high viral sharing
  1: 1.1, // Monday - motivation Monday, fresh start energy
  2: 1.2, // Tuesday - peak competitive engagement, students most active
  3: 1.4, // Wednesday - mid-week stress peak, need for distractions/challenges
  4: 1.3, // Thursday - pre-weekend push, high engagement before Friday
  5: 0.9, // Friday - still decent engagement, but social plans compete
  6: 1.0  // Saturday - steady engagement, weekend study sessions
} as const;

// =============================================================================
// BACKEND FUNCTIONS (Business Logic in US Eastern Time)
// =============================================================================

/**
 * Get current time in US Eastern timezone
 */
export function getCurrentTimeInET(): Date {
  return toZonedTime(new Date(), US_EASTERN_TZ);
}

/**
 * Create a specific date/time in US Eastern timezone
 */
export function createETDate(year: number, month: number, day: number, hour: number, minute: number = 0): Date {
  // Create date in ET timezone, then convert to UTC for storage
  const etDate = new Date(year, month - 1, day, hour, minute);
  return fromZonedTime(etDate, US_EASTERN_TZ);
}

/**
 * Get next optimal posting time for US students (business logic in ET)
 */
export function getNextOptimalPostingTimeET(fromDate?: Date): Date {
  const now = fromDate ? toZonedTime(fromDate, US_EASTERN_TZ) : getCurrentTimeInET();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Find next optimal time slot today
  for (const slot of OPTIMAL_POSTING_TIMES_ET) {
    const slotMinutes = slot.hour * 60 + slot.minute;
    if (slotMinutes > currentMinutes + 5) { // 5 minute buffer
      // Create ET time and convert to UTC
      const etTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.hour, slot.minute);
      return fromZonedTime(etTime, US_EASTERN_TZ);
    }
  }
  
  // No more slots today, use first slot tomorrow
  const tomorrow = addMinutes(now, 24 * 60);
  const firstSlot = OPTIMAL_POSTING_TIMES_ET[0];
  const etTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), firstSlot.hour, firstSlot.minute);
  return fromZonedTime(etTime, US_EASTERN_TZ);
}

/**
 * Check if a date falls within posting window (ET-based business logic)
 */
export function isWithinPostingWindowET(scheduledDate: Date, windowMinutes: number = 7): boolean {
  const now = getCurrentTimeInET();
  const scheduledET = toZonedTime(scheduledDate, US_EASTERN_TZ);
  
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = scheduledET.getHours() * 60 + scheduledET.getMinutes();
  
  return Math.abs(nowMinutes - scheduledMinutes) <= windowMinutes;
}

/**
 * Get engagement score for a given time (ET-based)
 */
export function getEngagementScoreET(date: Date): number {
  const etDate = toZonedTime(date, US_EASTERN_TZ);
  const hour = etDate.getHours();
  const dayOfWeek = etDate.getDay();
  
  const optimalHour = OPTIMAL_POSTING_TIMES_ET.find(time => time.hour === hour);
  const dayMultiplier = US_STUDENT_WEEKDAY_MULTIPLIERS[dayOfWeek as keyof typeof US_STUDENT_WEEKDAY_MULTIPLIERS];
  
  let baseScore = 0.3; // Base score for any time
  
  if (optimalHour) {
    switch (optimalHour.engagement) {
      case 'high': baseScore = 1.0; break;
      case 'medium': baseScore = 0.7; break;
      default: baseScore = 0.4; break;
    }
  }
  
  return Math.round((baseScore * dayMultiplier) * 100) / 100;
}

// =============================================================================
// FRONTEND FUNCTIONS (UI Display in User's Local Timezone)
// =============================================================================

/**
 * Format date for user display in their local timezone
 */
export function formatForUserDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

/**
 * Format date for datetime-local input (user's local timezone)
 */
export function formatForDateTimeInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format with timezone information for clarity
 */
export function formatWithTimezone(date: Date | string, showET: boolean = true): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localTime = formatForUserDisplay(dateObj);
  
  if (showET) {
    const etTime = formatTz(toZonedTime(dateObj, US_EASTERN_TZ), 'h:mm a', { timeZone: US_EASTERN_TZ });
    return `${localTime} (${etTime} ET)`;
  }
  
  return localTime;
}

/**
 * Format for precise scheduling display
 */
export function formatForSchedulingDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEE, MMM d, h:mm a');
}

/**
 * Get relative time (e.g., "in 2 hours", "5 minutes ago")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  
  if (Math.abs(diffMs) < 60000) return 'now';
  
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMs < 0) {
    // Past
    if (Math.abs(diffDays) >= 1) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
    if (Math.abs(diffHours) >= 1) return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
    return `${Math.abs(diffMinutes)} min ago`;
  } else {
    // Future
    if (diffDays >= 1) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours >= 1) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `in ${diffMinutes} min`;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Log with proper timezone context
 */
export function logWithTimezone(message: string, ...args: unknown[]): void {
  const etTime = formatTz(getCurrentTimeInET(), 'yyyy-MM-dd HH:mm:ss', { timeZone: US_EASTERN_TZ });
  console.log(`[${etTime} ET] ${message}`, ...args);
}

/**
 * Convert user input (local time) to UTC for storage
 */
export function userInputToUTC(localDateTime: string): Date {
  return new Date(localDateTime);
}

/**
 * Get timezone abbreviation for display
 */
export function getTimezoneAbbr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneName: 'short'
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || 'Local';
}