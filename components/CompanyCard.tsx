import React from "react";
import { Company } from "../types";
import { Star, Bookmark, ExternalLink } from "lucide-react";

interface CompanyRowProps {
  company: Company;
  sortRank: number | string;
  isMarked: boolean;
  onToggleMark: (id: number) => void;
}

const formatCompactCurrency = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(val);
};

export const CompanyRow: React.FC<CompanyRowProps> = ({
  company,
  sortRank,
  isMarked,
  onToggleMark,
}) => {
  const staffingPercent =
    company.capacity > 0
      ? Math.round((company.employees / company.capacity) * 100)
      : 0;

  // Performance Color Logic
  let perfColor = "text-yellow-600 dark:text-yellow-400";
  let perfBg = "bg-yellow-100 dark:bg-yellow-900/30";
  if (company.performance !== undefined) {
    if (company.performance > 5) {
      perfColor = "text-green-700 dark:text-green-400";
      perfBg = "bg-green-100 dark:bg-green-900/30";
    } else if (company.performance < -5) {
      perfColor = "text-red-700 dark:text-red-400";
      perfBg = "bg-red-100 dark:bg-red-900/30";
    }
  }

  const stars = [];
  for (let i = 1; i <= 10; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-2 h-2 md:w-3 md:h-3 ${i <= Math.round(company.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
      />,
    );
  }

  const handleRowClick = () => {
    window.open(
      `https://www.torn.com/joblist.php?step=search#!p=corpinfo&ID=${company.ID}`,
      "_blank",
    );
  };

  const handleMarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleMark(company.ID);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex flex-col md:grid md:grid-cols-[40px_60px_60px_3fr_180px_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-2 md:gap-4 items-start md:items-center border-b border-border p-3 md:p-3 transition-colors text-sm cursor-pointer ${isMarked ? "bg-blue-500/5 dark:bg-blue-500/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" : "bg-card hover:bg-muted/50"}`}
    >
      {/* Mobile Header Row: [Mark] [Index] [Name + Stars + ID Stacked] [TR] */}
      <div className="flex items-center gap-3 w-full md:contents">
        <div
          className="flex-none md:flex md:justify-center"
          onClick={handleMarkClick}
        >
          <Bookmark
            className={`w-7 h-7 md:w-5 md:h-5 transition-colors ${isMarked ? "fill-blue-500 text-blue-500" : "text-muted-foreground/30 hover:text-blue-400"}`}
          />
        </div>

        <div className="flex-none md:flex md:flex-col md:items-center">
          <span className="text-xl md:text-sm font-black text-muted-foreground/40 md:text-foreground">
            #{sortRank}
          </span>
        </div>

        {/* Desktop TR Column (Hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:items-center">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground font-bold text-xs border border-border"
            title="Torn Rank"
          >
            {company.torn_rank || "-"}
          </div>
        </div>

        <div className="flex-grow min-w-0 md:flex md:flex-col md:justify-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground truncate text-base md:text-sm group-hover:text-primary transition-colors">
              {company.name}
            </h3>
            <ExternalLink className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
          </div>

          <div className="flex flex-col gap-0.5 mt-0.5 md:mt-0">
            {/* Mobile Rating Stars - Above ID */}
            <div className="md:hidden flex items-center gap-0.5">{stars}</div>
            <span className="text-[10px] md:text-xs text-muted-foreground font-mono opacity-60">
              ID: {company.ID}
            </span>
            {/* Desktop specific Ranks for marked */}
            {isMarked && company.marked_ranks && (
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <span className="bg-blue-500/10 px-1 rounded">
                  Age: #{company.marked_ranks.rank_age}/
                  {company.marked_ranks.total_in_group}
                </span>
                <span className="bg-blue-500/10 px-1 rounded">
                  Rev: #{company.marked_ranks.rank_revenue}/
                  {company.marked_ranks.total_in_group}
                </span>
                <span className="bg-blue-500/10 px-1 rounded">
                  Cust: #{company.marked_ranks.rank_customers}/
                  {company.marked_ranks.total_in_group}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile TR (Rightmost) */}
        <div className="md:hidden flex-none">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">
              TR
            </span>
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-[10px] border border-primary/20">
              {company.torn_rank || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Ranks for Marked (Mobile specific) */}
      {isMarked && company.marked_ranks && (
        <div className="flex md:hidden flex-wrap gap-2 text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1 mt-1">
          <span className="bg-blue-500/10 px-1.5 py-0.5 rounded">
            Age #{company.marked_ranks.rank_age}
          </span>
          <span className="bg-blue-500/10 px-1.5 py-0.5 rounded">
            Rev #{company.marked_ranks.rank_revenue}
          </span>
          <span className="bg-blue-500/10 px-1.5 py-0.5 rounded">
            Cust #{company.marked_ranks.rank_customers}
          </span>
        </div>
      )}

      {/* Metrics Row (Improved Mobile Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:contents gap-y-3 gap-x-4 w-full mt-2 md:mt-0 pt-2 md:pt-0 border-t border-border/50 md:border-none">
        {/* Rating - Stars (Desktop Only) */}
        <div className="hidden md:flex md:flex-row md:items-center gap-1">
          <div className="flex items-center gap-0.5">{stars}</div>
        </div>

        {/* Daily $ + Performance Combined */}
        <div className="flex flex-col">
          <span className="md:hidden text-[9px] uppercase font-bold text-muted-foreground/50 tracking-tighter">
            Daily $ & Perf
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-foreground text-xs md:text-sm">
              {formatCompactCurrency(company.daily_income)}
            </span>
            <div
              className={`text-[9px] font-black px-1 rounded h-fit self-center ${perfColor} ${perfBg}`}
            >
              {company.performance !== undefined
                ? `${company.performance > 0 ? "+" : ""}${company.performance.toFixed(1)}%`
                : "-"}
            </div>
          </div>
        </div>

        {/* Weekly $ (Next to Daily on mobile) */}
        <div className="flex flex-col">
          <span className="md:hidden text-[9px] uppercase font-bold text-muted-foreground/50 tracking-tighter">
            Weekly Revenue
          </span>
          <span className="font-bold text-green-600 dark:text-green-400 text-xs md:text-sm">
            {formatCompactCurrency(company.weekly_income)}
          </span>
        </div>

        {/* Desktop Performance Column */}
        <div className="hidden md:flex flex-col">
          <div
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${perfColor} ${perfBg}`}
          >
            {company.performance !== undefined
              ? `${company.performance > 0 ? "+" : ""}${company.performance.toFixed(1)}%`
              : "-"}
          </div>
        </div>

        {/* Customers */}
        <div className="flex flex-col">
          <span className="md:hidden text-[9px] uppercase font-bold text-muted-foreground/50 tracking-tighter">
            Cust (D/W)
          </span>
          <span className="font-semibold text-foreground text-[10px] md:text-xs">
            {company.daily_customers}{" "}
            <span className="text-muted-foreground font-normal">
              / {company.weekly_customers}
            </span>
          </span>
        </div>

        {/* Age */}
        <div className="flex flex-col">
          <span className="md:hidden text-[9px] uppercase font-bold text-muted-foreground/50 tracking-tighter">
            Business Age
          </span>
          <span className="font-medium text-muted-foreground text-[10px] md:text-xs">
            {company.days_old} days
          </span>
        </div>

        {/* Staff */}
        <div className="flex flex-col">
          <span className="md:hidden text-[9px] uppercase font-bold text-muted-foreground/50 tracking-tighter">
            Staffing
          </span>
          <div className="flex flex-col gap-1">
            <span
              className={`font-bold text-[10px] md:text-xs ${staffingPercent === 100 ? "text-green-600 dark:text-green-500" : "text-foreground"}`}
            >
              {company.employees} / {company.capacity}{" "}
              <span className="text-[8px] font-normal opacity-50">
                ({staffingPercent}%)
              </span>
            </span>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${staffingPercent > 90 ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${staffingPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
