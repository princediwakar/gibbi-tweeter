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

// VIRAL CONTENT: Reduce spacing for maximum engagement waves
export function getSpacedPostingSchedule(count: number, minSpacingMinutes: number = 25, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime || new Date();
  
  for (let i = 0; i < count; i++) {
    let nextOptimal = getNextOptimalPostingTimeET(currentTime);
    
    // Ensure minimum spacing if we have previous posts
    if (schedule.length > 0) {
      const lastPostTime = schedule[schedule.length - 1];
      const minNextTime = new Date(lastPostTime.getTime() + minSpacingMinutes * 60 * 1000);
      
      // If the next optimal time conflicts with minimum spacing, enforce spacing
      if (nextOptimal <= minNextTime) {
        // Use the minimum spaced time and find the next optimal slot after that
        nextOptimal = getNextOptimalPostingTimeET(minNextTime);
        
        // If that still results in the same time as the last scheduled post, 
        // add additional buffer to ensure uniqueness
        if (nextOptimal.getTime() === lastPostTime.getTime()) {
          const bufferedTime = new Date(minNextTime.getTime() + 60000); // Add 1 minute
          nextOptimal = getNextOptimalPostingTimeET(bufferedTime);
        }
      }
    }
    
    schedule.push(nextOptimal);
    
    // For next iteration, ensure we start from after this scheduled time
    // Add minimum spacing plus small buffer to avoid same-time collisions
    currentTime = new Date(nextOptimal.getTime() + (minSpacingMinutes * 60 * 1000) + 60000);
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

// VIRAL CONTENT: Optimized scheduling for maximum viral engagement
export function getViralPostingSchedule(count: number, startTime?: Date): Date[] {
  const schedule: Date[] = [];
  let currentTime = startTime || new Date();
  
  // Target only HIGH engagement slots for viral content
  const viralSlots = [
    { hour: 7, minute: 30 },   // Morning commute
    { hour: 8, minute: 45 },   // Peak viral time  
    { hour: 11, minute: 45 },  // Pre-lunch competitive
    { hour: 12, minute: 15 },  // Lunch sharing peak
    { hour: 15, minute: 0 },   // After-school viral peak
    { hour: 16, minute: 15 },  // Procrastination time
    { hour: 19, minute: 15 },  // Study break
    { hour: 20, minute: 30 },  // Social media peak
    { hour: 21, minute: 45 }   // Night study sessions
  ];
  
  let slotIndex = 0;
  for (let i = 0; i < count; i++) {
    const slot = viralSlots[slotIndex % viralSlots.length];
    
    // Create next posting time
    const nextPost = new Date(currentTime);
    nextPost.setHours(slot.hour, slot.minute, 0, 0);
    
    // If this slot has passed today, move to tomorrow
    if (nextPost <= currentTime) {
      nextPost.setDate(nextPost.getDate() + 1);
    }
    
    schedule.push(nextPost);
    
    // Move to next viral slot (20-30 minute gaps for engagement waves)
    slotIndex++;
    currentTime = new Date(nextPost.getTime() + (20 * 60 * 1000)); // 20 min minimum gap
  }
  
  return schedule;
}

// Get the best time for specific viral content types
export function getBestTimeForViralContent(contentType: 'challenge' | 'trap' | 'question' | 'tip'): Date {
  const now = new Date();
  
  const bestTimes = {
    challenge: [8, 15, 20], // High energy times
    trap: [11, 16, 21],     // When students are most focused
    question: [7, 12, 19],  // Regular engagement periods  
    tip: [9, 13, 22]        // When people want quick wins
  };
  
  const targetHours = bestTimes[contentType];
  const currentHour = now.getHours();
  
  // Find next best hour
  const nextBestHour = targetHours.find(hour => hour > currentHour) || targetHours[0];
  
  const nextPost = new Date(now);
  nextPost.setHours(nextBestHour, Math.floor(Math.random() * 60), 0, 0);
  
  // If time has passed today, move to tomorrow
  if (nextPost <= now) {
    nextPost.setDate(nextPost.getDate() + 1);
  }
  
  return nextPost;
}