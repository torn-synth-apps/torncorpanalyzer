import { Company, CachedData } from '../types';
import { CACHE_KEY_PREFIX } from '../constants';

const getLastResetTime = (): number => {
  const now = new Date();
  const reset = new Date(now);
  // Torn Reset is 18:00 UTC (TCT)
  reset.setUTCHours(18, 0, 0, 0);

  // If we are currently before 18:00 UTC, the last reset was yesterday at 18:00 UTC
  if (now.getTime() < reset.getTime()) {
    reset.setUTCDate(reset.getUTCDate() - 1);
  }
  
  return reset.getTime();
};

const getCache = (typeId: number): CachedData | null => {
  try {
    const key = `${CACHE_KEY_PREFIX}${typeId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data: CachedData = JSON.parse(raw);
    const lastReset = getLastResetTime();

    // Invalidate if data is older than the last reset time
    if (data.timestamp < lastReset) {
      console.log(`Cache expired for type ${typeId}. Last reset: ${new Date(lastReset).toISOString()}, Data time: ${new Date(data.timestamp).toISOString()}`);
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Error reading cache", e);
    return null;
  }
};

const setCache = (typeId: number, companies: Company[]) => {
  try {
    const key = `${CACHE_KEY_PREFIX}${typeId}`;
    const data: CachedData = {
      timestamp: Date.now(),
      companies
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error setting cache", e);
  }
};

export const purgeCompaniesCache = (typeId: number): void => {
  try {
    const key = `${CACHE_KEY_PREFIX}${typeId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Error clearing cache", e);
  }
};

export const fetchCompanies = async (
  typeId: number,
  apiKey: string,
  options: { forceRefresh?: boolean } = {},
): Promise<Company[]> => {
  if (!apiKey) throw new Error("Please enter a valid Public Torn API Key.");

  const { forceRefresh = false } = options;

  if (forceRefresh) {
    purgeCompaniesCache(typeId);
  } else {
    // Check cache first
    const cached = getCache(typeId);
    if (cached) {
      console.log(`Returning cached data for type ${typeId}`);
      return cached.companies;
    }
  }

  // Fetch from API directly (Client-side)
  console.log(`Fetching live data for type ${typeId}`);
  const url = `https://api.torn.com/company/${typeId}?selections=companies&key=${apiKey}`;
  
  const response = await fetch(url);
  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.error || "Unknown API Error");
  }

  if (!json.company) {
    return []; // No companies found or empty response
  }

  // Transform object to array
  const companies: Company[] = Object.entries(json.company).map(([idStr, val]: [string, any]) => ({
    ID: parseInt(idStr, 10),
    name: val.name,
    company_type: val.company_type || typeId,
    rating: val.rating || 0,
    days_old: val.days_old || 0,
    employees: val.employees_hired || 0,
    capacity: val.employees_capacity || 0,
    daily_income: val.daily_income || 0,
    weekly_income: val.weekly_income || 0,
    daily_customers: val.daily_customers || 0,
    weekly_customers: val.weekly_customers || 0
  }));

  setCache(typeId, companies);
  return companies;
};
