import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Company, FilterState, SortDirection, SortField } from './types';
import { COMPANY_TYPES } from './constants';
import { fetchCompanies } from './services/tornApi';
import { CompanyRow } from './components/CompanyCard';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  AlertCircle,
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Key,
  Sun,
  Moon,
  RotateCcw,
  RefreshCw,
  Eye
} from 'lucide-react';

interface ViewStats {
  todayViews: number;
  totalViews: number;
}

// Dual Range Slider Component
const DualRangeSlider = ({ 
  min, 
  max, 
  minVal, 
  maxVal, 
  onChangeMin, 
  onChangeMax, 
  step = 1 
}: { 
  min: number, max: number, minVal: number, maxVal: number, onChangeMin: (v: number) => void, onChangeMax: (v: number) => void, step?: number 
}) => {
  const minPos = Math.min(((minVal - min) / (max - min)) * 100, 100);
  const maxPos = Math.min(((maxVal - min) / (max - min)) * 100, 100);

  return (
    <div className="relative w-full h-8 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(e) => {
          const value = Math.min(Number(e.target.value), maxVal - step);
          onChangeMin(value);
        }}
        className="absolute w-full h-full pointer-events-none appearance-none bg-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(e) => {
          const value = Math.max(Number(e.target.value), minVal + step);
          onChangeMax(value);
        }}
        className="absolute w-full h-full pointer-events-none appearance-none bg-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary"
      />
      <div className="absolute w-full h-1 bg-muted rounded z-10">
        <div 
          className="absolute h-full bg-primary/40 rounded" 
          style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
        />
      </div>
    </div>
  );
};

// Filter Block Component
const FilterBlock = ({ 
  label, 
  minLimit, 
  maxLimit, 
  currentMin, 
  currentMax, 
  onChangeMin, 
  onChangeMax, 
  step = 1 
}: { 
  label: string, 
  minLimit: number, 
  maxLimit: number, 
  currentMin: number, 
  currentMax: number | null, 
  onChangeMin: (v: number) => void, 
  onChangeMax: (v: number | null) => void,
  step?: number
}) => {
  const safeMax = currentMax === null ? maxLimit : currentMax;

  return (
    <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded border border-border">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex gap-2 items-center mb-1">
         <input 
            type="number" 
            className="w-full border border-border bg-background p-1 text-xs rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="Min"
            min={minLimit}
            max={safeMax}
            value={currentMin} 
            onChange={e => onChangeMin(Number(e.target.value))} 
         />
         <span className="text-muted-foreground text-xs">-</span>
         <input 
            type="number" 
            className="w-full border border-border bg-background p-1 text-xs rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="Max"
            min={currentMin}
            max={maxLimit}
            value={currentMax === null ? maxLimit : currentMax} 
            onChange={e => onChangeMax(Number(e.target.value))} 
         />
      </div>
      <DualRangeSlider 
        min={minLimit} 
        max={maxLimit} 
        minVal={currentMin} 
        maxVal={safeMax} 
        step={step}
        onChangeMin={onChangeMin}
        onChangeMax={(val) => onChangeMax(val === maxLimit ? null : val)}
      />
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: { title: string, value: string, subtext: string, icon: any, colorClass: string }) => (
  <div className="bg-card p-3 border border-border rounded-sm shadow-sm flex items-start gap-3 min-w-[200px] flex-1">
    <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon className={`w-4 h-4 ${colorClass}`} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={subtext}>{subtext}</p>
    </div>
  </div>
);

const DEFAULT_FILTERS: FilterState = {
  name: '',
  minStars: 0,
  maxStars: 10,
  minDailyIncome: 0,
  maxDailyIncome: null,
  minWeeklyIncome: 0,
  maxWeeklyIncome: null,
  minDailyCustomers: 0,
  maxDailyCustomers: null,
  minAge: 0,
  maxAge: null,
};

const VIEW_TRACKER_URL = "https://script.google.com/macros/s/AKfycbwMbi5ZHW7XDhlrrNmVOVTVljDiYtpEUujdtJaUdVvAS4wCFvLEvRHtf0ic0zQwHdKs9Q/exec";

const App: React.FC = () => {
  // --- State ---
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('torn_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [selectedType, setSelectedType] = useState<number>(() => {
    const saved = localStorage.getItem('torn_selected_type');
    return saved ? parseInt(saved, 10) : 10;
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set());
  const [showMarked, setShowMarked] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('torn_api_key') || '');
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('torn_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    return DEFAULT_FILTERS;
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>(() => {
    return (localStorage.getItem('torn_sort_field') as SortField) || 'weekly_income';
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    return (localStorage.getItem('torn_sort_direction') as SortDirection) || 'desc';
  });

  // --- Refs ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Theme Effect ---
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('torn_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('torn_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('torn_sort_field', sortField);
  }, [sortField]);

  useEffect(() => {
    localStorage.setItem('torn_sort_direction', sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    localStorage.setItem('torn_selected_type', selectedType.toString());
  }, [selectedType]);

  // --- Initial Load Effects ---
  useEffect(() => {
    const savedMarks = localStorage.getItem('torn_marked_companies');
    if (savedMarks) {
      try {
        setMarkedIds(new Set(JSON.parse(savedMarks)));
      } catch (e) { console.error("Failed to load marks", e); }
    }

    // Fetch view stats
    const fetchViewStats = async () => {
      try {
        const res = await fetch(VIEW_TRACKER_URL);
        const data = await res.json();
        if (data.success) {
          setViewStats({
            todayViews: data.todayViews,
            totalViews: data.totalViews
          });
        }
      } catch (e) {
        console.error("Failed to fetch view stats", e);
      }
    };
    fetchViewStats();
  }, []);

  const handleToggleMark = (id: number) => {
    const newSet = new Set(markedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setMarkedIds(newSet);
    localStorage.setItem('torn_marked_companies', JSON.stringify(Array.from(newSet)));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('torn_api_key', val);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // --- Helpers ---

  const calculateDerivedStats = (rawData: Company[]): Company[] => {
    const sortedForRank = [...rawData].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.weekly_income - a.weekly_income;
    });

    const rankMap = new Map<number, number>();
    sortedForRank.forEach((c, index) => {
      rankMap.set(c.ID, index + 1);
    });

    const companiesByStars = new Map<number, Company[]>();
    rawData.forEach(c => {
      const s = Math.round(c.rating); 
      if (!companiesByStars.has(s)) companiesByStars.set(s, []);
      companiesByStars.get(s)?.push(c);
    });

    const ageRankMap = new Map<number, {rank: number, total: number}>();
    const revRankMap = new Map<number, {rank: number, total: number}>();
    const custRankMap = new Map<number, {rank: number, total: number}>();

    companiesByStars.forEach((group, star) => {
      const total = group.length;
      group.sort((a, b) => a.days_old - b.days_old).forEach((c, i) => {
        ageRankMap.set(c.ID, { rank: i + 1, total });
      });
      group.sort((a, b) => b.weekly_income - a.weekly_income).forEach((c, i) => {
        revRankMap.set(c.ID, { rank: i + 1, total });
      });
      group.sort((a, b) => b.weekly_customers - a.weekly_customers).forEach((c, i) => {
        custRankMap.set(c.ID, { rank: i + 1, total });
      });
    });

    return rawData.map(c => {
      const weeklyAvg = c.weekly_income / 7;
      let perf = 0;
      if (weeklyAvg > 0) {
        perf = ((c.daily_income - weeklyAvg) / weeklyAvg) * 100;
      }

      return {
        ...c,
        torn_rank: rankMap.get(c.ID),
        performance: perf,
        marked_ranks: {
          rank_age: ageRankMap.get(c.ID)?.rank || 0,
          rank_revenue: revRankMap.get(c.ID)?.rank || 0,
          rank_customers: custRankMap.get(c.ID)?.rank || 0,
          total_in_group: ageRankMap.get(c.ID)?.total || 0,
        }
      };
    });
  };

  const getLimitValues = useMemo(() => {
    if (companies.length === 0) return { 
       maxIncomeD: 1000000, maxIncomeW: 7000000, maxCust: 1000, maxAge: 5000 
    };
    return {
      maxIncomeD: Math.max(...companies.map(c => c.daily_income), 1000),
      maxIncomeW: Math.max(...companies.map(c => c.weekly_income), 10000),
      maxCust: Math.max(...companies.map(c => c.daily_customers), 100),
      maxAge: Math.max(...companies.map(c => c.days_old), 100),
    };
  }, [companies]);

  // --- Handlers ---

  const handleFetch = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchCompanies(selectedType, apiKey);
      if (rawData.length === 0) {
        setError("No companies found for this type.");
        setCompanies([]);
      } else {
        const enrichedData = calculateDerivedStats(rawData);
        setCompanies(enrichedData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, apiKey]);

  // --- Auto Load Effect (Type change or initial key presence) ---
  useEffect(() => {
    if (apiKey) {
      handleFetch();
    }
  }, [selectedType, apiKey, handleFetch]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const displayData = useMemo(() => {
    let result = [...companies];
    if (filters.minStars > 0) result = result.filter(c => c.rating >= filters.minStars);
    if (filters.maxStars < 10) result = result.filter(c => c.rating <= filters.maxStars);
    if (filters.minDailyIncome > 0) result = result.filter(c => c.daily_income >= filters.minDailyIncome);
    if (filters.maxDailyIncome !== null) result = result.filter(c => c.daily_income <= filters.maxDailyIncome!);
    if (filters.minWeeklyIncome > 0) result = result.filter(c => c.weekly_income >= filters.minWeeklyIncome);
    if (filters.maxWeeklyIncome !== null) result = result.filter(c => c.weekly_income <= filters.maxWeeklyIncome!);
    if (filters.minDailyCustomers > 0) result = result.filter(c => c.daily_customers >= filters.minDailyCustomers);
    if (filters.maxDailyCustomers !== null) result = result.filter(c => c.daily_customers <= filters.maxDailyCustomers!);
    if (filters.minAge > 0) result = result.filter(c => c.days_old >= filters.minAge);
    if (filters.maxAge !== null) result = result.filter(c => c.days_old <= filters.maxAge!);

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const numA = (typeof valA === 'number') ? valA : 0;
      const numB = (typeof valB === 'number') ? valB : 0;
      if (numA < numB) return sortDirection === 'asc' ? -1 : 1;
      if (numA > numB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const rankedResult = result.map((c, idx) => ({ ...c, display_rank: idx + 1 }));
    if (filters.name) {
      const q = filters.name.toLowerCase();
      return rankedResult.filter(c => c.name.toLowerCase().includes(q));
    }
    return rankedResult;
  }, [companies, filters, sortField, sortDirection]);

  const idToRankMap = useMemo(() => {
    const map = new Map<number, number>();
    displayData.forEach(c => {
      if ((c as any).display_rank) {
        map.set(c.ID, (c as any).display_rank);
      }
    });
    return map;
  }, [displayData]);

  const markedData = useMemo(() => {
    const result = companies.filter(c => markedIds.has(c.ID));
    result.sort((a, b) => {
      const rankA = idToRankMap.get(a.ID) ?? 999999;
      const rankB = idToRankMap.get(b.ID) ?? 999999;
      if (rankA !== rankB) return rankA - rankB;
      return a.ID - b.ID;
    });
    return result;
  }, [companies, markedIds, idToRankMap]);

  const stats = useMemo(() => {
    if (displayData.length === 0) return null;
    const youngest = [...displayData].sort((a,b) => a.days_old - b.days_old)[0];
    const highestWeeklyRev = [...displayData].sort((a,b) => b.weekly_income - a.weekly_income)[0];
    const highestDailyRev = [...displayData].sort((a,b) => b.daily_income - a.daily_income)[0];
    const highestWeeklyCust = [...displayData].sort((a,b) => b.weekly_customers - a.weekly_customers)[0];
    const highestDailyCust = [...displayData].sort((a,b) => b.daily_customers - a.daily_customers)[0];
    const format = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n);

    return {
      youngest: { val: `${youngest.days_old}d`, name: youngest.name },
      highWRev: { val: `$${format(highestWeeklyRev.weekly_income)}`, name: highestWeeklyRev.name },
      highDRev: { val: `$${format(highestDailyRev.daily_income)}`, name: highestDailyRev.name },
      highWCust: { val: `${format(highestWeeklyCust.weekly_customers)}`, name: highestWeeklyCust.name },
      highDCust: { val: `${format(highestDailyCust.daily_customers)}`, name: highestDailyCust.name },
    };
  }, [displayData]);

  const TableHeader = ({ field, label, tooltip, className = "" }: { field: SortField, label: string, tooltip?: string, className?: string }) => (
    <div 
      onClick={() => handleSort(field)}
      className={`group cursor-pointer flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors select-none ${className}`}
      title={tooltip || `Sort by ${label}`}
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
      )}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden transition-colors duration-200">
      
      <header className="bg-card border-b border-border z-30 shadow-sm flex-none">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground p-2">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-primary">TornCorp<span className="text-muted-foreground font-light">Analyzer</span></h1>
                </div>
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors text-foreground"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
              <div className="relative w-full sm:w-auto flex items-center">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Key className="w-4 h-4" />
                 </div>
                 <input 
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter Public API Key"
                    className="w-full sm:w-40 pl-9 pr-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                 />
              </div>

              <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto flex items-center gap-2">
                <div className="relative flex-grow">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(Number(e.target.value))}
                    className="w-full sm:w-56 pl-3 pr-8 py-2 border border-border bg-background text-foreground text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
                  >
                    {COMPANY_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <button 
                  onClick={() => handleFetch()}
                  disabled={loading || !apiKey}
                  className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded transition-colors disabled:opacity-50"
                  title="Manual Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <button 
                onClick={() => setIsDark(!isDark)}
                className="hidden lg:flex p-2 rounded-full hover:bg-muted transition-colors text-foreground ml-2"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </header>

      <div className="flex-grow overflow-auto" ref={scrollContainerRef}>
        <main className="max-w-7xl mx-auto p-4 w-full flex flex-col gap-4">
          <div className="bg-card border border-border p-4 flex flex-col gap-4 shadow-sm flex-none">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 text-sm border border-border flex items-center justify-center gap-2 transition-colors ${showFilters ? 'bg-secondary' : 'bg-background hover:bg-muted'} text-foreground`}
                >
                  <Filter className="w-4 h-4" />
                  Filters {showFilters ? '▲' : '▼'}
                </button>
                <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                <FilterBlock label="Stars" minLimit={0} maxLimit={10} currentMin={filters.minStars} currentMax={filters.maxStars} onChangeMin={v => setFilters({...filters, minStars: v})} onChangeMax={v => setFilters({...filters, maxStars: v === null ? 10 : v})} />
                <FilterBlock label="Daily Income" minLimit={0} maxLimit={getLimitValues.maxIncomeD} currentMin={filters.minDailyIncome} currentMax={filters.maxDailyIncome} step={1000} onChangeMin={v => setFilters({...filters, minDailyIncome: v})} onChangeMax={v => setFilters({...filters, maxDailyIncome: v})} />
                <FilterBlock label="Weekly Income" minLimit={0} maxLimit={getLimitValues.maxIncomeW} currentMin={filters.minWeeklyIncome} currentMax={filters.maxWeeklyIncome} step={5000} onChangeMin={v => setFilters({...filters, minWeeklyIncome: v})} onChangeMax={v => setFilters({...filters, maxWeeklyIncome: v})} />
                <FilterBlock label="Daily Customers" minLimit={0} maxLimit={getLimitValues.maxCust} currentMin={filters.minDailyCustomers} currentMax={filters.maxDailyCustomers} onChangeMin={v => setFilters({...filters, minDailyCustomers: v})} onChangeMax={v => setFilters({...filters, maxDailyCustomers: v})} />
                <FilterBlock label="Age (Days)" minLimit={0} maxLimit={getLimitValues.maxAge} currentMin={filters.minAge} currentMax={filters.maxAge} step={10} onChangeMin={v => setFilters({...filters, minAge: v})} onChangeMax={v => setFilters({...filters, maxAge: v})} />
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-1">Showing {displayData.length} of {companies.length} results</div>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
              <StatCard title="Youngest" value={stats.youngest.val} subtext={stats.youngest.name} icon={Calendar} colorClass="text-blue-500" />
              <StatCard title="Highest W. Rev" value={stats.highWRev.val} subtext={stats.highWRev.name} icon={DollarSign} colorClass="text-green-500" />
              <StatCard title="Highest D. Rev" value={stats.highDRev.val} subtext={stats.highDRev.name} icon={DollarSign} colorClass="text-emerald-500" />
              <StatCard title="Highest W. Cust" value={stats.highWCust.val} subtext={stats.highWCust.name} icon={Users} colorClass="text-purple-500" />
              <StatCard title="Highest D. Cust" value={stats.highDCust.val} subtext={stats.highDCust.name} icon={Users} colorClass="text-indigo-500" />
            </div>
          )}

          {markedData.length > 0 && (
            <div className="bg-card border border-border shadow-sm flex flex-col mb-2 overflow-hidden">
              <div 
                className="p-3 border-b border-border bg-blue-500/10 flex justify-between items-center cursor-pointer select-none hover:bg-blue-500/20 transition-colors" 
                onClick={() => setShowMarked(!showMarked)}
              >
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                   <Bookmark className="w-4 h-4 fill-current" />
                   <h3 className="font-bold text-sm">Marked Companies</h3>
                   <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-full font-semibold">{markedData.length}</span>
                </div>
                {showMarked ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
              </div>
              {showMarked && (
                <div className="flex flex-col">
                   <div className="hidden md:grid grid-cols-[40px_60px_60px_3fr_180px_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 p-2 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                       <div className="text-center">Mark</div>
                       <div>#</div>
                       <div className="justify-center flex">TR</div>
                       <div>Company</div>
                       <div>Rating</div>
                       <div>Daily $</div>
                       <div>Weekly $</div>
                       <div>Perf %</div>
                       <div>Cust.</div>
                       <div>Age</div>
                       <div>Staff</div>
                   </div>
                   <div className="flex flex-col divide-y divide-border">
                      {markedData.map((company) => (
                          <CompanyRow 
                             key={company.ID} 
                             company={company} 
                             sortRank={idToRankMap.get(company.ID) ?? '-'} 
                             isMarked={true} 
                             onToggleMark={handleToggleMark} 
                          />
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-border shadow-sm flex flex-col min-h-[400px]">
            <div className="sticky top-0 z-20 hidden md:grid grid-cols-[40px_60px_60px_3fr_180px_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 p-3 border-b border-border bg-muted/50 backdrop-blur-sm shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Mark</div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#</div>
              <TableHeader field="torn_rank" label="TR" className="justify-center" tooltip="Torn Rank: Stars > Weekly Revenue" />
              <TableHeader field="name" label="Company" />
              <TableHeader field="rating" label="Rating" />
              <TableHeader field="daily_income" label="Daily $" tooltip="Daily Income" />
              <TableHeader field="weekly_income" label="Weekly $" tooltip="Weekly Income" />
              <TableHeader field="performance" label="Perf %" tooltip="Performance: (Daily vs Weekly Avg)" />
              <TableHeader field="daily_customers" label="Cust." tooltip="Daily Customers" />
              <TableHeader field="days_old" label="Age" />
              <TableHeader field="employees" label="Staff" tooltip="Employees / Capacity" />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center flex-grow py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Fetching live Torn data...</p>
                </div>
            ) : displayData.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {displayData.map((company) => (
                  <CompanyRow key={company.ID} company={company} sortRank={(company as any).display_rank} isMarked={markedIds.has(company.ID)} onToggleMark={handleToggleMark} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow py-20 text-center">
                {!loading && companies.length === 0 ? (
                  <p className="text-muted-foreground">Enter your Public API key to view {COMPANY_TYPES.find(t => t.id === selectedType)?.name}.</p>
                ) : (
                  <>
                    <p className="text-muted-foreground">No matches for current filters.</p>
                    <button onClick={resetFilters} className="mt-2 text-primary hover:underline text-sm font-medium">Clear all filters</button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <footer className="mt-8 mb-8 border-t border-border pt-6 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
             <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span>© 2025</span>
                  <a href="https://www.torn.com/profiles.php?XID=3165209" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">PixelGhost</a>
                  <span className="mx-1">•</span>
                  <span className="text-xs italic">Analyzed directly from Torn City</span>
                </div>
                {viewStats && (
                  <div className="flex items-center gap-4 mt-2 px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      <span>Today: <span className="text-foreground">{viewStats.todayViews}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-border pl-4">
                      <span>Total: <span className="text-foreground">{viewStats.totalViews}</span></span>
                    </div>
                  </div>
                )}
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;