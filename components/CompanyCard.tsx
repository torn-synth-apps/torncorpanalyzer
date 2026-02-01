import React from 'react';
import { Company } from '../types';
import { Star, Bookmark, ExternalLink } from 'lucide-react';

interface CompanyRowProps {
  company: Company;
  sortRank: number | string;
  isMarked: boolean;
  onToggleMark: (id: number) => void;
}

const formatCompactCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    notation: "compact", 
    maximumFractionDigits: 1 
  }).format(val);
};

export const CompanyRow: React.FC<CompanyRowProps> = ({ company, sortRank, isMarked, onToggleMark }) => {
  const staffingPercent = company.capacity > 0 ? Math.round((company.employees / company.capacity) * 100) : 0;
  
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
        className={`w-3 h-3 ${i <= Math.round(company.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
      />
    );
  }

  const handleRowClick = () => {
    window.open(`https://www.torn.com/joblist.php?step=search#!p=corpinfo&ID=${company.ID}`, '_blank');
  };

  const handleMarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleMark(company.ID);
  };

  return (
    <div 
      onClick={handleRowClick}
      className={`group relative grid grid-cols-2 md:grid-cols-[40px_60px_60px_3fr_180px_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-2 md:gap-4 items-center border-b border-border p-3 transition-colors text-sm cursor-pointer ${isMarked ? 'bg-blue-500/5 dark:bg-blue-500/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20' : 'bg-card hover:bg-muted/50'}`}
    >
      <div className="flex justify-center md:justify-start" onClick={handleMarkClick}>
        <Bookmark className={`w-5 h-5 transition-colors ${isMarked ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground/40 hover:text-blue-400'}`} />
      </div>

      <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0">
        <span className="md:hidden font-bold text-muted-foreground mr-1">#</span>
        <span className="font-bold text-foreground">{sortRank}</span>
      </div>

      <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0">
         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground font-bold text-xs border border-border" title="Torn Rank">
            {company.torn_rank || '-'}
         </div>
      </div>

      <div className="col-span-2 md:col-span-1 overflow-hidden flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground truncate text-base md:text-sm group-hover:text-primary transition-colors">
            {company.name}
          </h3>
          <ExternalLink className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">ID: {company.ID}</span>
        
        {isMarked && company.marked_ranks && (
           <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              <span className="bg-blue-500/10 px-1 rounded">Age: #{company.marked_ranks.rank_age}/{company.marked_ranks.total_in_group}</span>
              <span className="bg-blue-500/10 px-1 rounded">Rev: #{company.marked_ranks.rank_revenue}/{company.marked_ranks.total_in_group}</span>
              <span className="bg-blue-500/10 px-1 rounded">Cust: #{company.marked_ranks.rank_customers}/{company.marked_ranks.total_in_group}</span>
           </div>
        )}
      </div>

      <div className="col-span-2 md:col-span-1 flex items-center gap-0.5">
        {stars}
      </div>

      <div className="flex flex-col">
        <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Daily Income</span>
        <span className="font-medium text-foreground">{formatCompactCurrency(company.daily_income)}</span>
      </div>

      <div className="flex flex-col">
        <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Weekly Income</span>
        <span className="font-semibold text-green-600 dark:text-green-500">{formatCompactCurrency(company.weekly_income)}</span>
      </div>

      <div className="flex flex-col">
        <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Perf</span>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${perfColor} ${perfBg}`}>
          {company.performance !== undefined ? `${company.performance > 0 ? '+' : ''}${company.performance.toFixed(1)}%` : '-'}
        </div>
      </div>

      <div className="flex flex-col">
         <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Customers</span>
         <span className="font-medium text-foreground text-xs">{company.daily_customers} / {company.weekly_customers}</span>
      </div>

      <div className="flex flex-col">
         <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Age</span>
         <span className="font-medium text-muted-foreground">{company.days_old}d</span>
      </div>

      <div className="flex flex-col">
         <span className="md:hidden text-[10px] uppercase font-bold text-muted-foreground">Staffing</span>
         <div className="flex items-center gap-1">
            <span className={`font-bold ${staffingPercent === 100 ? 'text-green-600 dark:text-green-500' : 'text-foreground'}`}>
              {company.employees}/{company.capacity}
            </span>
         </div>
         <div className="w-12 h-1 bg-muted mt-1 hidden md:block rounded-full overflow-hidden">
            <div className={`h-full ${staffingPercent > 90 ? 'bg-green-500' : 'bg-primary'}`} style={{width: `${staffingPercent}%`}}></div>
         </div>
      </div>
    </div>
  );
};