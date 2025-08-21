declare module 'google-trends-api' {
  export interface DailyTrendsOptions {
    trendDate?: Date;
    geo?: string;
    hl?: string;
  }

  export interface RealTimeTrendsOptions {
    geo?: string;
    hl?: string;
    category?: string;
  }

  export function dailyTrends(options: DailyTrendsOptions): Promise<string>;
  export function realTimeTrends(options: RealTimeTrendsOptions): Promise<string>;
}