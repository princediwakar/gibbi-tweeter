// Optimal posting times for maximum engagement on X/Twitter

export interface OptimalTime {
  hour: number;
  minute: number;
  description: string;
  engagement: 'high' | 'medium' | 'low';
}

// Based on research: Twitter engagement peaks at specific times
// Times are in 24-hour format, assuming local timezone
export const OPTIMAL_POSTING_TIMES: OptimalTime[] = [
  { hour: 9, minute: 0, description: 'Morning coffee check', engagement: 'high' },
  { hour: 12, minute: 0, description: 'Lunch break scrolling', engagement: 'high' },
  { hour: 15, minute: 0, description: 'Afternoon energy dip', engagement: 'medium' },
  { hour: 17, minute: 0, description: 'End of workday', engagement: 'high' },
  { hour: 19, minute: 0, description: 'Evening wind-down', engagement: 'high' },
  { hour: 21, minute: 0, description: 'Prime time scrolling', engagement: 'high' }
];

export const WEEKDAY_MULTIPLIERS: Record<number, number> = {
  0: 0.7, // Sunday
  1: 1.0, // Monday
  2: 1.1, // Tuesday
  3: 1.1, // Wednesday
  4: 0.9, // Thursday
  5: 0.8, // Friday
  6: 0.6  // Saturday
};

export function getNextOptimalPostTime(fromDate: Date = new Date()): Date {
  const now = new Date(fromDate);
  const today = new Date(now);
  
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
  let currentTime = startTime || new Date();
  
  for (let i = 0; i < count; i++) {
    const nextOptimal = getNextOptimalPostTime(currentTime);
    schedule.push(nextOptimal);
    
    // For the next iteration, start from just after this scheduled time
    currentTime = new Date(nextOptimal.getTime() + 1000); // Add 1 second
  }
  
  return schedule;
}

export function isOptimalPostingTime(date: Date): { isOptimal: boolean; engagement: string } {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  
  const optimalHour = OPTIMAL_POSTING_TIMES.find(time => time.hour === hour);
  const dayMultiplier = WEEKDAY_MULTIPLIERS[dayOfWeek];
  
  if (optimalHour && dayMultiplier >= 0.8) {
    return { 
      isOptimal: true, 
      engagement: optimalHour.engagement 
    };
  }
  
  return { isOptimal: false, engagement: 'low' };
}

export function getEngagementScore(date: Date): number {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  
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

// Helper function to format date for datetime-local input (assumes IST)
export function toDateTimeLocal(date: Date): string {
  // Format date for datetime-local input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper function to format date in IST for display
export function formatISTTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}