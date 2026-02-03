import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
}) => (
  <div className="bg-card p-1.5 md:p-2 border border-border shadow-sm flex items-center md:items-start gap-1.5 md:gap-2 min-w-[120px] md:min-w-[150px] flex-1">
    <div className={`p-1 md:p-1.5 rounded-full ${colorClass} bg-opacity-10 shrink-0`}>
      <Icon className={`w-2.5 h-2.5 md:w-3 md:h-3 ${colorClass}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[9px] text-muted-foreground font-bold uppercase tracking-widest truncate">
        {title}
      </p>
      <p className="text-[10px] md:text-xs font-black text-foreground truncate">
        {value}
      </p>
      <p
        className="text-[8px] md:text-[9px] text-muted-foreground truncate opacity-70 hidden sm:block"
        title={subtext}
      >
        {subtext}
      </p>
    </div>
  </div>
);

export default StatCard;
