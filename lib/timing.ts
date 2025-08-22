// Optimal posting times for maximum engagement on X/Twitter
import { toIST, formatDateIST, formatDateTimeLocalIST } from './timezone';

export interface OptimalTime {
  hour: number;
  minute: number;
  description: string;
  engagement: 'high' | 'medium' | 'low';
}

// Based on research: Twitter engagement peaks at specific times
// Expanded schedule to support 10-15 posts daily with 75-90 minute spacing
// Times are in 24-hour format, assuming local timezone (IST)
// Total: 15 optimal posting windows per day
export const OPTIMAL_POSTING_TIMES: OptimalTime[] = [
  { hour: 8, minute: 0, description: 'Morning coffee check', engagement: 'high' },
  { hour: 9, minute: 30, description: 'Mid-morning productivity', engagement: 'medium' },
  { hour: 10, minute: 0, description: 'Late morning engagement', engagement: 'medium' },
  { hour: 11, minute: 30, description: 'Pre-lunch browse', engagement: 'medium' },
  { hour: 12, minute: 0, description: 'Lunch break scrolling', engagement: 'high' },
  { hour: 13, minute: 30, description: 'Post-lunch check', engagement: 'medium' },
  { hour: 14, minute: 0, description: 'Afternoon work break', engagement: 'medium' },
  { hour: 15, minute: 0, description: 'Afternoon energy dip', engagement: 'medium' },
  { hour: 16, minute: 30, description: 'Late afternoon break', engagement: 'medium' },
  { hour: 17, minute: 0, description: 'End of workday', engagement: 'high' },
  { hour: 18, minute: 30, description: 'Commute home time', engagement: 'medium' },
  { hour: 19, minute: 0, description: 'Evening wind-down', engagement: 'high' },
  { hour: 20, minute: 30, description: 'Dinner time browse', engagement: 'medium' },
  { hour: 21, minute: 0, description: 'Prime time scrolling', engagement: 'high' },
  { hour: 22, minute: 0, description: 'Night owl activity', engagement: 'medium' }
];

// Adjusted multipliers for higher volume posting (10-15 daily)
export const WEEKDAY_MULTIPLIERS: Record<number, number> = {
  0: 0.8, // Sunday - increased for weekend content
  1: 1.0, // Monday 
  2: 1.1, // Tuesday - peak engagement
  3: 1.1, // Wednesday - peak engagement
  4: 1.0, // Thursday - maintained
  5: 0.9, // Friday - slightly reduced
  6: 0.8  // Saturday - increased for weekend content
};

export function getNextOptimalPostTime(fromDate: Date = new Date()): Date {
  const now = toIST(fromDate);
  const today = toIST(new Date(now));
  
  // Find the next optimal time today
  const todaysTimes = OPTIMAL_POSTING_TIMES
    .map(time => {
      const optimalTime = new Date(today);
      optimalTime.setHours(time.hour, time.minute, 0, 0);
      return { ...time, date: optimalTime };
    })
    .filter(time => time.date > now);

  // If we have optimal times left today, return the next one
  if (todaysTimes.length > 0) {
    return todaysTimes[0].date;
  }

  // Otherwise, get the first optimal time tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(OPTIMAL_POSTING_TIMES[0].hour, OPTIMAL_POSTING_TIMES[0].minute, 0, 0);
  
  return tomorrow;
}

export function getOptimalPostingSchedule(count: number, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime ? toIST(startTime) : toIST(new Date());
  
  for (let i = 0; i < count; i++) {
    const nextOptimal = getNextOptimalPostTime(currentTime);
    schedule.push(nextOptimal);
    
    // For the next iteration, start from just after this scheduled time
    currentTime = new Date(nextOptimal.getTime() + 1000); // Add 1 second
  }
  
  return schedule;
}

// Helper function to ensure minimum spacing between posts (anti-spam protection)
export function getSpacedPostingSchedule(count: number, minSpacingMinutes: number = 45, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime ? toIST(startTime) : toIST(new Date());
  
  for (let i = 0; i < count; i++) {
    const nextOptimal = getNextOptimalPostTime(currentTime);
    
    // Ensure minimum spacing if we have previous posts
    if (schedule.length > 0) {
      const lastPostTime = schedule[schedule.length - 1];
      const minNextTime = new Date(lastPostTime.getTime() + minSpacingMinutes * 60 * 1000);
      
      if (nextOptimal < minNextTime) {
        // Find the next optimal time that meets our spacing requirement
        const spacedTime = new Date(minNextTime);
        const nextSpacedOptimal = getNextOptimalPostTime(spacedTime);
        schedule.push(nextSpacedOptimal);
        currentTime = new Date(nextSpacedOptimal.getTime() + 1000);
        continue;
      }
    }
    
    schedule.push(nextOptimal);
    currentTime = new Date(nextOptimal.getTime() + 1000);
  }
  
  return schedule;
}

export function isOptimalPostingTime(date: Date): { isOptimal: boolean; engagement: string } {
  const istDate = toIST(date);
  const hour = istDate.getHours();
  const dayOfWeek = istDate.getDay();
  
  const optimalHour = OPTIMAL_POSTING_TIMES.find(time => time.hour === hour);
  const dayMultiplier = WEEKDAY_MULTIPLIERS[dayOfWeek];
  
  // More permissive for high-volume posting schedule
  if (optimalHour && dayMultiplier >= 0.7) {
    return { 
      isOptimal: true, 
      engagement: optimalHour.engagement 
    };
  }
  
  return { isOptimal: false, engagement: 'low' };
}

export function getEngagementScore(date: Date): number {
  const istDate = toIST(date);
  const hour = istDate.getHours();
  const dayOfWeek = istDate.getDay();
  
  const optimalHour = OPTIMAL_POSTING_TIMES.find(time => time.hour === hour);
  const dayMultiplier = WEEKDAY_MULTIPLIERS[dayOfWeek];
  
  let baseScore = 0.3; // Base score for any time
  
  if (optimalHour) {
    switch (optimalHour.engagement) {
      case 'high': baseScore = 1.0; break;
      case 'medium': baseScore = 0.7; break;
      case 'low': baseScore = 0.4; break;
    }
  }
  
  return Math.round((baseScore * dayMultiplier) * 100) / 100;
}

export function formatOptimalTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  const engagement = isOptimalPostingTime(date);
  const score = getEngagementScore(date);
  
  return `${formatted} (${score * 100}% engagement${engagement.isOptimal ? ' ⭐' : ''})`;
}

// Helper function to format date for datetime-local input (IST-based)
export function toDateTimeLocal(date: Date): string {
  return formatDateTimeLocalIST(date);
}

// Helper function to format date in IST for display
export function formatISTTime(date: Date): string {
  return formatDateIST(date);
}