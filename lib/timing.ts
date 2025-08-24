// Optimal posting times for maximum engagement on X/Twitter - US Student Focus
// This file is now simplified - complex logic moved to datetime.ts
import { getNextOptimalPostingTimeET, formatForUserDisplay, formatForDateTimeInput, getEngagementScoreET } from './datetime';

export interface OptimalTime {
  hour: number;
  minute: number;
  description: string;
  engagement: 'high' | 'medium' | 'low';
}

// Legacy interface for backwards compatibility
// Actual timing logic is now in datetime.ts with proper timezone handling

// Legacy - moved to datetime.ts

export function getNextOptimalPostTime(fromDate: Date = new Date()): Date {
  return getNextOptimalPostingTimeET(fromDate);
}

export function getOptimalPostingSchedule(count: number, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime || new Date();
  
  for (let i = 0; i < count; i++) {
    const nextOptimal = getNextOptimalPostingTimeET(currentTime);
    schedule.push(nextOptimal);
    
    // For the next iteration, start from just after this scheduled time
    currentTime = new Date(nextOptimal.getTime() + 1000); // Add 1 second
  }
  
  return schedule;
}

// Helper function to ensure minimum spacing between posts (anti-spam protection)
export function getSpacedPostingSchedule(count: number, minSpacingMinutes: number = 45, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime || new Date();
  
  for (let i = 0; i < count; i++) {
    const nextOptimal = getNextOptimalPostingTimeET(currentTime);
    
    // Ensure minimum spacing if we have previous posts
    if (schedule.length > 0) {
      const lastPostTime = schedule[schedule.length - 1];
      const minNextTime = new Date(lastPostTime.getTime() + minSpacingMinutes * 60 * 1000);
      
      if (nextOptimal < minNextTime) {
        // Find the next optimal time that meets our spacing requirement
        const spacedTime = new Date(minNextTime);
        const nextSpacedOptimal = getNextOptimalPostingTimeET(spacedTime);
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
  const score = getEngagementScoreET(date);
  return {
    isOptimal: score >= 0.7,
    engagement: score >= 1.0 ? 'high' : score >= 0.7 ? 'medium' : 'low'
  };
}

export function getEngagementScore(date: Date): number {
  return getEngagementScoreET(date);
}

export function formatOptimalTime(date: Date): string {
  const formatted = formatForUserDisplay(date);
  const engagement = isOptimalPostingTime(date);
  const score = getEngagementScoreET(date);
  
  return `${formatted} (${Math.round(score * 100)}% engagement${engagement.isOptimal ? ' ⭐' : ''})`;
}

// Helper function to format date for datetime-local input (user's local timezone)
export function toDateTimeLocal(date: Date): string {
  return formatForDateTimeInput(date);
}

// Helper function to format date for display in user's local timezone  
export function formatETTime(date: Date): string {
  return formatForUserDisplay(date);
}