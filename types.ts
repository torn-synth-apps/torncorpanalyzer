export interface MarkedRanks {
  rank_age: number;      // Youngest rank amongst same star count
  rank_revenue: number;  // Weekly revenue rank amongst same star count
  rank_customers: number; // Weekly customers rank amongst same star count
  total_in_group: number;
}

export interface Company {
  ID: number;
  name: string;
  company_type: number;
  rating: number; // 0-10
  days_old: number;
  employees: number;
  capacity: number;
  daily_income: number;
  weekly_income: number;
  daily_customers: number;
  weekly_customers: number;
  torn_rank?: number; // Calculated rank based on Stars > Weekly Income
  performance?: number; // Calculated % diff vs weekly average
  marked_ranks?: MarkedRanks; // Ranks if bookmarked
}

export interface CachedData {
  timestamp: number;
  companies: Company[];
}

export interface FilterState {
  name: string;
  minStars: number;
  maxStars: number;
  minDailyIncome: number;
  maxDailyIncome: number | null; // null means no max
  minWeeklyIncome: number;
  maxWeeklyIncome: number | null;
  minDailyCustomers: number;
  maxDailyCustomers: number | null;
  minAge: number;
  maxAge: number | null;
}

export type SortField = 'name' | 'rating' | 'daily_income' | 'weekly_income' | 'daily_customers' | 'days_old' | 'torn_rank' | 'employees' | 'performance';
export type SortDirection = 'asc' | 'desc';

export interface CompanyTypeOption {
  id: number;
  name: string;
}