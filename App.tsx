import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Company, FilterState, SortDirection, SortField } from "./types";
import { COMPANY_TYPES } from "./constants";
import { fetchCompanies } from "./services/tornApi";
import { CompanyRow } from "./components/CompanyCard";
import FilterBlock from "./components/filters/FilterBlock";
import StatCard from "./components/StatCard";
import TableHeader from "./components/TableHeader";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  Filter,
  Key,
  Loader2,
  Moon,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  Sun,
  Users,
  X,
} from "lucide-react";

interface ViewStats {
  todayViews: number;
  totalViews: number;
}

const DEFAULT_FILTERS: FilterState = {
  name: "",
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

const VIEW_TRACKER_URL =
  "https://script.google.com/macros/s/AKfycbwMbi5ZHW7XDhlrrNmVOVTVljDiYtpEUujdtJaUdVvAS4wCFvLEvRHtf0ic0zQwHdKs9Q/exec";

const App: React.FC = () => {
  // --- State ---
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("torn_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [selectedType, setSelectedType] = useState<number>(() => {
    const saved = localStorage.getItem("torn_selected_type");
    return saved ? parseInt(saved, 10) : 10;
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set());
  const [showMarked, setShowMarked] = useState(true);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("torn_api_key") || "",
  );
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);
  const hasTrackedViewRef = useRef(false);

  // Scroll visibility state for mobile
  const [hideInputs, setHideInputs] = useState(false);
  const [showCompactBar, setShowCompactBar] = useState(false);
  const lastScrollTopRef = useRef(0);

  // Filters
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem("torn_filters");
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
  const [showSortPopUp, setShowSortPopUp] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>(() => {
    return (
      (localStorage.getItem("torn_sort_field") as SortField) ||
      "weekly_income"
    );
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    return (
      (localStorage.getItem("torn_sort_direction") as SortDirection) || "desc"
    );
  });

  // --- Refs ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Scroll Handler ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const st = container.scrollTop;
      const isMobile = window.innerWidth < 1024;

      if (!isMobile) {
        setHideInputs(false);
        setShowCompactBar(false);
        return;
      }

      if (st > lastScrollTopRef.current && st > 100) {
        // Scrolling down - Hide header inputs
        setHideInputs(true);
        setShowCompactBar(false);
      } else if (st < lastScrollTopRef.current) {
        // Scrolling up - Show compact expansion bar
        if (st < 50) {
          setHideInputs(false);
          setShowCompactBar(false);
        } else if (hideInputs) {
          setShowCompactBar(true);
        }
      }
      lastScrollTopRef.current = st <= 0 ? 0 : st;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hideInputs]);

  // --- Theme Effect ---
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("torn_theme", isDark ? "dark" : "light");
  }, [isDark]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem("torn_filters", JSON.stringify(filters));
    localStorage.setItem("torn_sort_field", sortField);
    localStorage.setItem("torn_sort_direction", sortDirection);
    localStorage.setItem("torn_selected_type", selectedType.toString());
  }, [filters, sortField, sortDirection, selectedType]);

  // --- Initial Load Effects ---
  useEffect(() => {
    const savedMarks = localStorage.getItem("torn_marked_companies");
    if (savedMarks) {
      try {
        setMarkedIds(new Set(JSON.parse(savedMarks)));
      } catch (e) {
        console.error("Failed to load marks", e);
      }
    }

    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    const fetchViewStats = async () => {
      try {
        const res = await fetch(VIEW_TRACKER_URL, {
          method: "GET",
          redirect: "follow",
          mode: "cors",
        });
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        const data = await res.json();
        if (data && data.success) {
          setViewStats({
            todayViews: data.todayViews,
            totalViews: data.totalViews,
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
    localStorage.setItem(
      "torn_marked_companies",
      JSON.stringify(Array.from(newSet)),
    );
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem("torn_api_key", val);
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
    rawData.forEach((c) => {
      const s = Math.round(c.rating);
      if (!companiesByStars.has(s)) companiesByStars.set(s, []);
      companiesByStars.get(s)?.push(c);
    });

    const ageRankMap = new Map<number, { rank: number; total: number }>();
    const revRankMap = new Map<number, { rank: number; total: number }>();
    const custRankMap = new Map<number, { rank: number; total: number }>();

    companiesByStars.forEach((group, star) => {
      const total = group.length;
      group
        .sort((a, b) => a.days_old - b.days_old)
        .forEach((c, i) => {
          ageRankMap.set(c.ID, { rank: i + 1, total });
        });
      group
        .sort((a, b) => b.weekly_income - a.weekly_income)
        .forEach((c, i) => {
          revRankMap.set(c.ID, { rank: i + 1, total });
        });
      group
        .sort((a, b) => b.weekly_customers - a.weekly_customers)
        .forEach((c, i) => {
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
        },
      };
    });
  };

  const getLimitValues = useMemo(() => {
    if (companies.length === 0) {
      return {
        maxIncomeD: 1000000,
        maxIncomeW: 7000000,
        maxCust: 1000,
        maxAge: 5000,
      };
    }
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

  useEffect(() => {
    if (apiKey) handleFetch();
  }, [selectedType, apiKey, handleFetch]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const baseRankedData = useMemo(() => {
    let result = [...companies];
    if (filters.minStars > 0) result = result.filter(c => c.rating >= filters.minStars);
    if (filters.maxStars < 10) result = result.filter(c => c.rating <= filters.maxStars);
    if (filters.minDailyIncome > 0) result = result.filter(c => c.daily_income >= filters.minDailyIncome);
    if (filters.maxDailyIncome !== null) {
      result = result.filter((c) => c.daily_income <= filters.maxDailyIncome!);
    }
    if (filters.minWeeklyIncome > 0) {
      result = result.filter((c) => c.weekly_income >= filters.minWeeklyIncome);
    }
    if (filters.maxWeeklyIncome !== null) {
      result = result.filter(
        (c) => c.weekly_income <= filters.maxWeeklyIncome!,
      );
    }
    if (filters.minDailyCustomers > 0) {
      result = result.filter(
        (c) => c.daily_customers >= filters.minDailyCustomers,
      );
    }
    if (filters.maxDailyCustomers !== null) {
      result = result.filter(
        (c) => c.daily_customers <= filters.maxDailyCustomers!,
      );
    }
    if (filters.minAge > 0) {
      result = result.filter((c) => c.days_old >= filters.minAge);
    }
    if (filters.maxAge !== null) {
      result = result.filter((c) => c.days_old <= filters.maxAge!);
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      const numA = typeof valA === "number" ? valA : 0;
      const numB = typeof valB === "number" ? valB : 0;
      if (numA < numB) return sortDirection === "asc" ? -1 : 1;
      if (numA > numB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result.map((c, idx) => ({ ...c, display_rank: idx + 1 }));
  }, [companies, filters, sortField, sortDirection]);

  const displayData = useMemo(() => {
    if (!filters.name) return baseRankedData;
    const q = filters.name.toLowerCase();
    return baseRankedData.filter((c) => c.name.toLowerCase().includes(q));
  }, [baseRankedData, filters.name]);

  const idToRankMap = useMemo(() => {
    const map = new Map<number, number>();
    baseRankedData.forEach((c) => {
      if ((c as any).display_rank) map.set(c.ID, (c as any).display_rank);
    });
    return map;
  }, [baseRankedData]);

  const markedData = useMemo(() => {
    const result = companies.filter((c) => markedIds.has(c.ID));
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
    const youngest = [...displayData].sort((a, b) => a.days_old - b.days_old)[0];
    const highestWeeklyRev = [...displayData].sort(
      (a, b) => b.weekly_income - a.weekly_income,
    )[0];
    const highestDailyRev = [...displayData].sort(
      (a, b) => b.daily_income - a.daily_income,
    )[0];
    const highestWeeklyCust = [...displayData].sort(
      (a, b) => b.weekly_customers - a.weekly_customers,
    )[0];
    const highestDailyCust = [...displayData].sort(
      (a, b) => b.daily_customers - a.daily_customers,
    )[0];
    const format = (n: number) =>
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);

    return [
      {
        id: "hwr",
        title: "High W. Rev",
        value: `$${format(highestWeeklyRev.weekly_income)}`,
        subtext: highestWeeklyRev.name,
        icon: DollarSign,
        colorClass: "text-green-500",
      },
      {
        id: "hdr",
        title: "High D. Rev",
        value: `$${format(highestDailyRev.daily_income)}`,
        subtext: highestDailyRev.name,
        icon: DollarSign,
        colorClass: "text-emerald-500",
      },
      {
        id: "hwc",
        title: "High W. Cust",
        value: `${format(highestWeeklyCust.weekly_customers)}`,
        subtext: highestWeeklyCust.name,
        icon: Users,
        colorClass: "text-purple-500",
      },
      {
        id: "hdc",
        title: "High D. Cust",
        value: `${format(highestDailyCust.daily_customers)}`,
        subtext: highestDailyCust.name,
        icon: Users,
        colorClass: "text-indigo-500",
      },
      {
        id: "yng",
        title: "Youngest",
        value: `${youngest.days_old}d`,
        subtext: youngest.name,
        icon: Calendar,
        colorClass: "text-blue-500",
      },
    ];
  }, [displayData]);

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden transition-colors duration-200">
      
      {/* Scroll-aware Wrapper for Header and Compact Bar */}
      <div className="flex-none z-30 flex flex-col">
        <header
          className={`bg-card border-border z-30 shadow-sm transition-all duration-300 overflow-hidden ${
            hideInputs
              ? "max-h-0 md:max-h-[500px] border-b-0 opacity-0 md:opacity-100"
              : "max-h-[500px] border-b opacity-100"
          }`}
        >
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
              <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground p-2">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-primary">
                      TornCorp
                      <span className="text-muted-foreground font-light">
                        Analyzer
                      </span>
                    </h1>
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
                      {COMPANY_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
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
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="hidden lg:flex p-2 rounded-full hover:bg-muted transition-colors text-foreground ml-2"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>
        </header>

        {/* Mobile Compact Expansion Bar - Visible only on scroll up when inputs are hidden */}
        {showCompactBar && hideInputs && (
          <div
            onClick={() => {
              setHideInputs(false);
              setShowCompactBar(false);
            }}
            className="lg:hidden bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] h-8 flex items-center justify-center cursor-pointer shadow-lg animate-in slide-in-from-top duration-300 shrink-0"
          >
            <div className="flex items-center gap-2">
              <span>Select company type</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-auto" ref={scrollContainerRef}>
        <main className="max-w-7xl mx-auto p-4 w-full flex flex-col gap-4">
          <div className="bg-card border border-border p-4 flex flex-col gap-4 shadow-sm flex-none mt-2">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full pl-9 pr-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 md:flex-none px-4 py-2 text-sm border border-border flex items-center justify-center gap-2 transition-colors ${
                    showFilters ? "bg-secondary" : "bg-background hover:bg-muted"
                  } text-foreground`}
                >
                  <Filter className="w-4 h-4" /> Filters{" "}
                  {showFilters ? "▲" : "▼"}
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 md:flex-none px-4 py-2 text-sm border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={() => setShowSortPopUp(true)}
                  className="md:hidden p-2 border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                <FilterBlock
                  label="Stars"
                  minLimit={0}
                  maxLimit={10}
                  currentMin={filters.minStars}
                  currentMax={filters.maxStars}
                  onChangeMin={(v) => setFilters({ ...filters, minStars: v })}
                  onChangeMax={(v) =>
                    setFilters({ ...filters, maxStars: v === null ? 10 : v })
                  }
                />
                <FilterBlock
                  label="Daily Income"
                  minLimit={0}
                  maxLimit={getLimitValues.maxIncomeD}
                  currentMin={filters.minDailyIncome}
                  currentMax={filters.maxDailyIncome}
                  step={1000}
                  onChangeMin={(v) =>
                    setFilters({ ...filters, minDailyIncome: v })
                  }
                  onChangeMax={(v) =>
                    setFilters({ ...filters, maxDailyIncome: v })
                  }
                />
                <FilterBlock
                  label="Weekly Income"
                  minLimit={0}
                  maxLimit={getLimitValues.maxIncomeW}
                  currentMin={filters.minWeeklyIncome}
                  currentMax={filters.maxWeeklyIncome}
                  step={5000}
                  onChangeMin={(v) =>
                    setFilters({ ...filters, minWeeklyIncome: v })
                  }
                  onChangeMax={(v) =>
                    setFilters({ ...filters, maxWeeklyIncome: v })
                  }
                />
                <FilterBlock
                  label="Daily Customers"
                  minLimit={0}
                  maxLimit={getLimitValues.maxCust}
                  currentMin={filters.minDailyCustomers}
                  currentMax={filters.maxDailyCustomers}
                  onChangeMin={(v) =>
                    setFilters({ ...filters, minDailyCustomers: v })
                  }
                  onChangeMax={(v) =>
                    setFilters({ ...filters, maxDailyCustomers: v })
                  }
                />
                <FilterBlock
                  label="Age (Days)"
                  minLimit={0}
                  maxLimit={getLimitValues.maxAge}
                  currentMin={filters.minAge}
                  currentMax={filters.maxAge}
                  step={10}
                  onChangeMin={(v) => setFilters({ ...filters, minAge: v })}
                  onChangeMax={(v) => setFilters({ ...filters, maxAge: v })}
                />
              </div>
            )}
            <div className="text-[10px] md:text-xs text-muted-foreground pt-1 uppercase font-bold tracking-widest opacity-60">Showing {displayData.length} of {companies.length} results</div>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {stats.map((s) => (
                <StatCard
                  key={s.id}
                  title={s.title}
                  value={s.value}
                  subtext={s.subtext}
                  icon={s.icon}
                  colorClass={s.colorClass}
                />
              ))}
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
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    Marked Companies
                  </h3>
                  <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full font-black">
                    {markedData.length}
                  </span>
                </div>
                {showMarked ? (
                  <ChevronUp className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                )}
              </div>
              {showMarked && (
                <div className="flex flex-col divide-y divide-border">
                  {markedData.map((company) => (
                    <CompanyRow
                      key={company.ID}
                      company={company}
                      sortRank={idToRankMap.get(company.ID) ?? "-"}
                      isMarked
                      onToggleMark={handleToggleMark}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-border shadow-sm flex flex-col min-h-[400px]">
            <div className="sticky top-0 z-20 hidden md:grid grid-cols-[40px_60px_60px_3fr_180px_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 p-3 border-b border-border bg-muted/50 backdrop-blur-sm shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Mark</div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#</div>
              <TableHeader
                field="torn_rank"
                label="TR"
                className="justify-center"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader field="name" label="Company" />
              <TableHeader
                field="rating"
                label="Rating"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="daily_income"
                label="Daily $"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="weekly_income"
                label="Weekly $"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="performance"
                label="Perf %"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="daily_customers"
                label="Cust."
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="days_old"
                label="Age"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader
                field="employees"
                label="Staff"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center flex-grow py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-sm font-medium">
                  Fetching live industry data...
                </p>
              </div>
            ) : displayData.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {displayData.map((company) => (
                  <CompanyRow
                    key={company.ID}
                    company={company}
                    sortRank={(company as any).display_rank}
                    isMarked={markedIds.has(company.ID)}
                    onToggleMark={handleToggleMark}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow py-20 text-center">
                {!loading && companies.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Enter your Public API key to view{" "}
                    {COMPANY_TYPES.find((t) => t.id === selectedType)?.name}.
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      No matches for current filters.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-primary hover:underline text-xs font-bold uppercase tracking-widest"
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <footer className="mt-8 mb-8 border-t border-border pt-6 flex flex-col items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <span>© 2025</span>
                <a
                  href="https://www.torn.com/profiles.php?XID=3165209"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  PixelGhost
                </a>
              </div>
              {viewStats && (
                <div className="flex items-center gap-4 mt-2 px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />
                    <span>
                      Today:{" "}
                      <span className="text-foreground">
                        {viewStats.todayViews}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-border pl-4">
                    <span>
                      Total:{" "}
                      <span className="text-foreground">
                        {viewStats.totalViews}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </footer>
        </main>
      </div>

      {showSortPopUp && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-card border-t border-border w-full max-w-md p-6 rounded-t-2xl shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-lg uppercase tracking-widest text-primary">Sort Companies</h3>
              <button
                onClick={() => setShowSortPopUp(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                "name",
                "rating",
                "daily_income",
                "weekly_income",
                "performance",
                "daily_customers",
                "days_old",
                "employees",
                "torn_rank",
              ].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    handleSort(f as SortField);
                    setShowSortPopUp(false);
                  }}
                  className={`px-4 py-3 text-sm font-bold border flex items-center justify-between transition-colors ${
                    sortField === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border"
                  }`}
                >
                  {f.replace("_", " ")}
                  {sortField === f &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    ))}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                  setShowSortPopUp(false);
                }}
                className="flex-1 py-3 bg-secondary text-secondary-foreground font-black uppercase text-xs tracking-widest"
              >
                Reverse
              </button>
              <button
                onClick={() => setShowSortPopUp(false)}
                className="flex-1 py-3 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
