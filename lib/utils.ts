import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone and date utilities for IST
export const INDIAN_TZ = 'Asia/Kolkata';

export function getCurrentTimeInIST(): Date {
  // Create a proper IST date using Intl
  const now = new Date();
  const istTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);
  
  const year = parseInt(istTime.find(part => part.type === 'year')?.value || '2025');
  const month = parseInt(istTime.find(part => part.type === 'month')?.value || '1') - 1; // 0-indexed
  const day = parseInt(istTime.find(part => part.type === 'day')?.value || '1');
  const hour = parseInt(istTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(istTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(istTime.find(part => part.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
}

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

export function toDateTimeLocal(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatOptimalTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatForUserDisplay(dateObj) + ' IST';
}
