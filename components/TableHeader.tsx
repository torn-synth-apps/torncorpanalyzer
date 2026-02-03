import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { SortDirection, SortField } from "../types";

interface TableHeaderProps {
  field: SortField;
  label: string;
  tooltip?: string;
  className?: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  field,
  label,
  tooltip,
  className = "",
  sortField,
  sortDirection,
  onSort,
}) => (
  <div
    onClick={() => onSort(field)}
    className={`group cursor-pointer flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors select-none ${className}`}
    title={tooltip || `Sort by ${label}`}
  >
    {label}
    {sortField === field ? (
      sortDirection === "asc" ? (
        <ArrowUp className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3" />
      )
    ) : (
      <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
    )}
  </div>
);

export default TableHeader;
